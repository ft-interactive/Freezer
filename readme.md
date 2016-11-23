# ❄️ Freezer ❄️

A little script for making an archive of a site. Specifically aimed at ig sites running on some dynamic back end (e.g. heroku)

Given some URLs to start from /Freezer/ will spider a site and download all assets and pages it finds bellow a root URL. 

## Apache rewrites
HTML pages without extensions will be given an HTML extension and an .htaccess file will be created by default to deal with redirecting to the appropriate resource e.g. 'https://ig.ft.com/us-elections/nevada-polls' would be saved as 'nevada-polls.html' and the redirect would then deal with responding to requests for 'nevada-polls' correctly.
The site root will be saved as `index.html`

## Image service URLs
Freezer understands [v2 origami image service](https://www.ft.com/__origami/service/image/v2) URLS and if the source image is under the root it will save that

## Usage
 0. You'll need node
 1. Clone this repository 
 2. `npm install`
 3. To archive a site run the script with the following arguments
   *  `--siteroot` the root URL of the site
   *  `--out` the local directory to which files will be written
   *  `--initial` you can add aditional links to spider if they are not accesible from the root of your site.
   *  `--rewrite` create an .htaccess file to redirect urls without extensions to .html files

example: 
```
node freezer.js --siteroot https://ig.ft.com/us-elections/ --initial https://ig.ft.com/us-elections/polls,https://ig.ft.com/us-elections/results,https://ig.ft.com/us-elections/full-results.json --out us-election-2016
```

## Then what?

The idea is that the static files generated on you local machine can be FTPd up to a directory on our webserver in a place which corresponds to the path structure of the dynamic app.