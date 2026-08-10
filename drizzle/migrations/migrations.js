// This file is required for Expo/React Native SQLite migrations - https://orm.drizzle.team/quick-sqlite/expo

import journal from './meta/_journal.json';
import m0000 from './0000_past_revanche.sql';
import m0001 from './0001_mushy_puck.sql';
import m0002 from './0002_magenta_yellowjacket.sql';
import m0003 from './0003_little_cyclops.sql';
import m0004 from './0004_nice_the_renegades.sql';
import m0005 from './0005_faithful_proteus.sql';
import m0006 from './0006_overjoyed_siren.sql';

  export default {
    journal,
    migrations: {
      m0000,
m0001,
m0002,
m0003,
m0004,
m0005,
m0006
    }
  }
  