import {handleSqlRequest} from '../../shared/postgres/http.js';
import {openHostedSql} from '../../shared/postgres/hosted.ts';
export default req => handleSqlRequest(req,'dailyMessage',openHostedSql);
