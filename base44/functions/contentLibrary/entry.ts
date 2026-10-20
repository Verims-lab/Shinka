import {handleSqlRequest} from '../../shared/postgres/http.js';
import {openHostedSql} from '../../shared/postgres/hosted.ts';
import * as astronomy from 'npm:astronomy-engine@2.1.19';
export default req => handleSqlRequest(req,'contentLibrary',openHostedSql,{astronomy});
