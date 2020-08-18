#! /usr/bin/env node

/**
 * Tool to create new posts on dev.to and setup everything on your local machine.
 * example: ./tools/create-post.js "Here my new post title"
 */

const config = require('./config.json');
const devToGit = require('../dev-to-git.json');
const fsExtra = require('fs-extra');
const fs = require('fs');
const join = require('path').join;
const got = require('got');

const postName = process.argv[2];
const newFilesName = postName.trim().replace(/\s/g, '-');

const targetFolder = config.targetFolder;
const templatePath = join(targetFolder, config.templateFolder);

console.log('- Creating the new post structure');
fsExtra.copySync(templatePath, join(targetFolder, newFilesName));
fsExtra.renameSync(
  join(targetFolder, newFilesName, config.templateFolder + '.md'),
  join(targetFolder, newFilesName, newFilesName + '.md'),
);

console.log('- Creating post on dev.to...');
got('https://dev.to/api/articles', {
  method: 'post',
  json: { article: { title: postName, body_markdown: '' } },
  responseType: 'json',
  headers: {
    'Content-Type': 'application/json',
    'api-key': config.apiKey,
  },
})
  .then(({ body }) => body.id)
  .then(id => {
    console.log(`- Post created successfully`);
    console.log(`- The new post id is #${id}`);
    return id;
  })
  .then(id => {
    newDevToGit = {
      id: id,
      relativePathToArticle: `./blog-posts/${newFilesName}/${newFilesName}.md`,
    };
    console.log(`- Adding new object relation ${JSON.stringify(newDevToGit)}`);
    devToGit.push(newDevToGit);
    console.log('- Saving new dev-to-git.json');
    return writeFilePromise(join('.', 'dev-to-git.json'), JSON.stringify(devToGit));
  })
  .catch(e => {
    console.error('- Ups something went wrong!');
    console.error(e.message);
  });

function writeFilePromise(path, data) {
  return new Promise((res, rej) =>
    fs.writeFile(path, data, 'utf8', e => {
      if (e) rej(e);
      res();
    }),
  );
}
