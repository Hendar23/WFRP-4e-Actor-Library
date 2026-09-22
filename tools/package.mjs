import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const manifest=JSON.parse(fs.readFileSync(path.join(root,'module/module.json'),'utf8'));
const pkg=JSON.parse(fs.readFileSync(path.join(root,'package.json'),'utf8'));
assert.equal(manifest.version,pkg.version,'Module and package versions must match');
assert(/^\d+\.\d+\.\d+$/.test(manifest.version),'Use a stable three-part version');
const repository='https://github.com/Hendar23/WFRP-4e-Actor-Library';
assert.equal(manifest.manifest,`${repository}/releases/latest/download/module.json`);
assert.equal(manifest.download,`${repository}/releases/download/v${manifest.version}/wfrp4e-quick-npc-library.zip`);
execFileSync(process.execPath,['tools/build.mjs','--check'],{cwd:root,stdio:'inherit'});
fs.mkdirSync(path.join(root,'dist'),{recursive:true});
fs.writeFileSync(path.join(root,'dist/module.json'),JSON.stringify(manifest,null,2)+'\n');
execFileSync('python3',['-c',`
from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED
root=Path('.')
with ZipFile('dist/wfrp4e-quick-npc-library.zip','w',ZIP_DEFLATED) as archive:
    for file in sorted((root/'module').rglob('*')):
        if file.is_file():
            archive.write(file,file.relative_to(root/'module'))
with ZipFile('dist/wfrp4e-quick-npc-library.zip') as archive:
    assert archive.read('module.json') == (root/'module/module.json').read_bytes()
    assert 'scripts/main.js' in archive.namelist()
    assert 'scripts/data.js' in archive.namelist()
`],{cwd:root,stdio:'inherit'});
console.log(`Packaged v${manifest.version}: dist/module.json and dist/wfrp4e-quick-npc-library.zip`);
