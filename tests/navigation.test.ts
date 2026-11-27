import {test} from 'node:test';
import assert from 'node:assert/strict';
import {documents,resolveDocLink} from '../playground/navigation.js';

test('documentation links stay in the reader for local and GitHub source URLs',()=>{
  for(const page of ['https://tverderesi.github.io/einstein/playground/','http://localhost:3000/playground/']) {
    for(const [route,[,path]] of Object.entries(documents)) {
      assert.equal(resolveDocLink('../'+path,'docs/GUIDE.md',page),'#'+route);
      assert.equal(resolveDocLink('https://github.com/tverderesi/einstein/blob/main/'+path,'docs/GUIDE.md',page),'#'+route);
    }
    assert.equal(resolveDocLink('ARTICLE.md','docs/GUIDE.md',page),'#ARTICLE');
  }
});

test('external research and explicitly requested source-file links retain their destinations',()=>{
  const page='https://tverderesi.github.io/einstein/playground/';
  assert.equal(resolveDocLink('https://futhark-lang.org/index.html','docs/ARTICLE.md',page),'https://futhark-lang.org/index.html');
  assert.equal(resolveDocLink('../src/compiler.ts','docs/ARTICLE.md',page),'https://github.com/tverderesi/einstein/blob/main/src/compiler.ts');
});
