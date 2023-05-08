#!/bin/sh
npm run build &&
	cp dist/index.html ../static/_includes/ &&
	cp dist/*.js ../static/
