const cheerio = require('cheerio');
const url = require('url');
const fetchUrl = require('fetch').fetchUrl;
const fs = require('fs');
const saver = require('./saver');
const package = require('./package.json')

let config = {
	siteroot: 'https://ig.ft.com/us-elections/',
	outdir: 'out',
	initialPages: [
		{resource: 'https://ig.ft.com/us-elections/', type:'href'},
		{resource: 'https://ig.ft.com/us-elections/polls', type:'href'},
		{resource: 'https://ig.ft.com/us-elections/results', type:'href'},
		{resource: 'https://ig.ft.com/us-elections/full-result.json', type:'script'} ],
};

config.altsiteroot = config.siteroot.split('https:')[1];

console.log('FREEZER ' + package.version);
console.log(config);
console.log('--');

function urlSet(){
	const set = {};

	function list(){
		return set;
	}

	list.add = function(resource, type){
		if(!resource || set[resource]) return false;
		if(!type) type = 'href';
		let visited = true;
		if(type == 'href') visited = false;
		set[resource] = { visited , type, resource };
		return true;
	}

	list.visited = function(v){
		set[v].visited = true;
	}

	list.getUnvisited = function(){
		const notVisited = Object.keys(set).find( function(d){
			return !set[d].visited
		});
		return notVisited;
	}

	list.getURLs = function(){
		return Object.keys(set);
	}

	return list;
}

const spideredSet = urlSet();
config.initialPages.forEach(function(d){
	spideredSet.add(d.resource, d.type);
});

spiderURL( spideredSet.getUnvisited() );

function spiderURL(spiderableURL){
	if(!spiderableURL){
		console.log(' :( ', spiderableURL);
		return;
	}
	console.log('fetching', spiderableURL)
	fetchUrl(spiderableURL, function(error, meta, body){
		if (!error) {
	    	getURLs( body.toString(), spiderableURL );
		}else{
			console.log('error', error, spiderableURL);
		}
	});
}

function toFollow(testURL){
	//further URLs which we're interested in or not.
	// nothing starting with a # 
	// nothing starting with 'http' or 'https' that doesn;t then immediately match the siteroot
	// everything else please
	if(!testURL.indexOf) return false;
	if(testURL.indexOf('#') === 0) return false;
	const isAbsoluteLink = (testURL.indexOf('http')===0 || testURL.indexOf('https')===0 || testURL.indexOf('//')===0)
	const isRoot = (testURL.indexOf(config.siteroot) === 0 || testURL.indexOf(config.altsiteroot) === 0)
	if(isAbsoluteLink && !isRoot) return false;
	if(isRoot) return testURL;
	return url.resolve(config.siteroot, testURL); 
}

function decodeImageService(imageURL){
	const fragments = imageURL.split('https://www.ft.com/__origami/service/image/v2/images/raw/');
	if(fragments.length > 1){
		return decodeURIComponent(fragments[1]);
	}
	return imageURL;
}

function getURLs(page, spiderableURL){
	console.log('spidering ', spiderableURL);

	const $ = cheerio.load(page);

	$('a').each((i, d) => {
		const testURL = cheerio(d).attr('href');	
		if(testURL) spideredSet.add(toFollow(testURL), 'href');
	});

	$('link').each((i, d) => {
		const testURL = cheerio(d).attr('href');	
		if(testURL) spideredSet.add(toFollow(testURL), 'href');
	});

	$('img').each((i, d) => {
		const testURL = decodeImageService( cheerio(d).attr('src') );
		if(testURL) spideredSet.add(toFollow(testURL), 'img');
	});

	$('iframe').each((i, d) => {
		const testURL = cheerio(d).attribs('src');	
		if(testURL) spideredSet.add(toFollow(testURL), 'href');
	});

	$('script').each((i, d) => {
		const testURL = cheerio(d).attr('src');	
		if(testURL) spideredSet.add(toFollow(testURL), 'script');
	});

	$('object').each((i, d) => {
		const testURL = cheerio(d).attr('data');
		if(testURL) spideredSet.add(toFollow(testURL), 'object');
	});

	spideredSet.visited( spiderableURL );

	const nextURL = spideredSet.getUnvisited();
	if( nextURL ){
		spiderURL(nextURL)
	}else{
		saver( Object.keys(spideredSet()), config.siteroot, config.outdir, rewrite=true )
		console.log('DONE');
	};
}
