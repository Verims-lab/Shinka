import {POSTGRES_HEALTH_CASES} from './cases/postgres';
import { ADMIN_TEST_HEALTH_CASES } from './cases/adminTestTools';
// Health catalog assembly — ordered by suite.
import { H01_CASES } from "./cases/h01";
import { H02_CASES } from "./cases/h02";
import { H03_CASES } from "./cases/h03";
import { H04_CASES } from "./cases/h04";
import { H05_CASES } from "./cases/h05";
import { H12_CASES } from "./cases/h12";
import { H13_CASES } from "./cases/h13";
import { H16_CASES } from "./cases/h16";
import { ONBOARDING_HEALTH_CASES } from './cases/onboarding';
import { DAILY_HEALTH_CASES } from './cases/daily';
import { CALENDAR_HEALTH_CASES } from './cases/calendar';
import { FUTURE_CASES } from "./cases/future";
import { SUITES } from "./suites";

const ALL = [...POSTGRES_HEALTH_CASES, ...H01_CASES, ...H02_CASES, ...H03_CASES, ...H04_CASES, ...H05_CASES, ...FUTURE_CASES, ...ONBOARDING_HEALTH_CASES, ...DAILY_HEALTH_CASES, ...CALENDAR_HEALTH_CASES, ...ADMIN_TEST_HEALTH_CASES, ...H12_CASES, ...H13_CASES, ...H16_CASES];
const order = (id) => SUITES.findIndex((s) => s.id === id);
export const HEALTH_CASES = Object.freeze([...ALL].sort((a, b) => order(a.suiteId) - order(b.suiteId)));
