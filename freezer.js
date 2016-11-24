const cheerio = require('cheerio');
const fetchUrl = require('fetch').fetchUrl;
const url = require('url');

const saver = require('./saver');
const package = require('./package.json')

//defaults
let config = {
	siteroot: '',
	out: 'out',
	rewrite: true,
	initial: [],
};

const args = require('minimist')(process.argv.slice(2));

if(Object.keys(args).length == 1 || args.h || args.help) usage();

if(args.initial) args.initial = args.initial.split(',').map(d=> {
	return { resource:d, type:'href' }; })


config = Object.assign(config, args);
if(String(config.rewrite).toLowerCase() === "false") config.rewrite = false;
if(config.initial.length==0) config.initial.push({ resource:config.siteroot, type:'href' });
console.log('FREEZER ' + package.version);
console.log(config);

const spideredSet = urlSet();
spideredSet.add(config.root, 'href');
config.initial.forEach(function(d){
	spideredSet.add(d.resource, d.type);
});
spiderURL( spideredSet.getUnvisited() );



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

function spiderURL(spiderableURL){
	console.log(spiderableURL)
	if(!spiderableURL){
		console.log(' :( ', spiderableURL);
		return;
	}
	console.log('\t...fetching')
	fetchUrl(spiderableURL, function(error, meta, body){
		if (!error) {
	    	getURLs( body.toString(), spiderableURL ,config );
		}else{
			console.log('error', error, spiderableURL);
		}
	});
}
function followChecker(root){
	const altroot = root.split('https:')[1];
	return function toFollow(testURL){
		//further URLs which we're interested in or not.
		// nothing starting with a # 
		// nothing starting with 'http' or 'https' that doesn;t then immediately match the siteroot
		// everything else please
		if(!testURL.indexOf) return false;
		if(testURL.indexOf('#') === 0) return false;
		const isAbsoluteLink = (testURL.indexOf('http')===0 || testURL.indexOf('https')===0 || testURL.indexOf('//')===0)
		const isRoot = (testURL.indexOf(root) === 0 || testURL.indexOf(altroot) === 0)
		if(isAbsoluteLink && !isRoot) return false;
		if(isRoot) return testURL;
		return url.resolve(root, testURL); 
	}
}
function decodeImageService(imageURL){
	const fragments = imageURL.split('https://www.ft.com/__origami/service/image/v2/images/raw/');
	if(fragments.length > 1){
		return decodeURIComponent(fragments[1]);
	}
	return imageURL;
}

function getURLs(page, spiderableURL, conf){
	console.log('\t...spidering ');
	const $ = cheerio.load(page);
	const toFollow = followChecker(conf.siteroot);

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
		saver( Object.keys(spideredSet()), conf.siteroot, conf.out, rewrite=conf.rewrite )
		console.log('DONE');
	};
}

function usage(){
	const switches = 
	'\n--siteroot [STRING] \n\tspecify the root of the site\n\teg --siteroot https://ig.ft.com/us-elections/'
	+ 
	'\n--initial [STRING] \n\ta comma separated list of urls from which to start the spidering \n\teg --initial https://ig.ft.com/us-elections/polls,https://ig.ft.com/us-elections/results'
	+
	'\n--out [STRING] \n\tthe output directory (relative to the current location) \n\t--output us-elections-2016'
	+
	'\n--rewrite [true|false] \n\tshould the script create an .htaccess file to rewrite pages without extensions to .html (defaults to true) \n\teg --rewrite false';
	console.log(switches);
	process.exit(0);
}
