import * as path from 'path';
import * as ncp from 'ncp';

const emailsSourcePath = path.resolve(
  __dirname,
  '../plugins/mailing/templates',
);
const emailsDestinationPath = path.resolve(
  __dirname,
  '../../dist/plugins/mailing/templates',
);

ncp(emailsSourcePath, emailsDestinationPath, { stopOnErr: true }, (err) => {
  if (err) return console.error(err);
});
