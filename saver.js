const fetchUrl = require('fetch').fetchUrl;
const fs = require('fs-extra');
const path = require('path');
const rewriteRule = "RewriteEngine On\nRewriteCond %{REQUEST_FILENAME} !-f\nRewriteRule ^([^\.]+)$ $1.html [NC,L]"

function saveFileList(list, root, outdir, rewrite){
	 list.forEach(d=>{
	 		console.log(d.split(root));
			const relativeFilePath = d.split(root)[1].split('/');
			if(relativeFilePath[0] == ''){
				relativeFilePath[0] = 'index.html';
			}
			relativeFilePath.unshift(outdir);
			//if the last element doesn't have an extension add an index.html
			if(relativeFilePath[relativeFilePath.length-1].indexOf('.')<0){
				relativeFilePath[relativeFilePath.length-1] = relativeFilePath[relativeFilePath.length-1]+'.html';
			}
			const relativeDir = relativeFilePath.slice(0,relativeFilePath.length-1);
			fetchUrl(d, function(error, meta, body){
			if (!error) {
				fs.ensureDirSync( relativeDir.join('/') );
				console.log('write', relativeFilePath.join('/'));
		    	fs.writeFileSync(relativeFilePath.join('/'), body.toString() );
			}else{
				console.log('error', error, d);
			}
		});
	});
	console.log('writing readme.md');
	fs.ensureDirSync( outdir );
	fs.writeFileSync( outdir + '/readme.md', 'Archive of ' + root + ' created ' + new Date() + '\n * ' + list.join('\n * '));
	if(rewrite){
		fs.writeFileSync(outdir +'/.htaccess', rewriteRule);
	}
}

module.exports = saveFileList;


//for testing purposes you can run this module by itself
if (require.main === module) {
	const siteroot = 'https://ig.ft.com/us-elections/';
	const list = fs.readFileSync('testset.txt','utf-8').split('\n');
	saveFileList(list,siteroot,'out')
}