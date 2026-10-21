import { PRIVACY_HEALTH_CASES } from './cases/privacy';
import { YOU_HEALTH_CASES } from './cases/you';
import { PATTERN_HEALTH_CASES } from './cases/pattern';
import { LOCAL_HEALTH_IDS } from '../../../base44/shared/healthExecutionScope.js';
import { APPLICABILITY } from './constants';
import {NATIVE_HEALTH_CASES} from './cases/native';
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
import { H15_CASES } from './cases/h15';
import { ONBOARDING_HEALTH_CASES } from './cases/onboarding';
import { DAILY_HEALTH_CASES } from './cases/daily';
import { CALENDAR_HEALTH_CASES } from './cases/calendar';
import { FUTURE_CASES } from "./cases/future";
import { SUITES } from "./suites";

const ALL = [...PRIVACY_HEALTH_CASES, ...YOU_HEALTH_CASES, ...PATTERN_HEALTH_CASES, ...NATIVE_HEALTH_CASES, ...H01_CASES, ...H02_CASES, ...H03_CASES, ...H04_CASES, ...H05_CASES, ...FUTURE_CASES, ...ONBOARDING_HEALTH_CASES, ...DAILY_HEALTH_CASES, ...CALENDAR_HEALTH_CASES, ...ADMIN_TEST_HEALTH_CASES, ...H12_CASES, ...H13_CASES, ...H15_CASES, ...H16_CASES];
const order = (id) => SUITES.findIndex((s) => s.id === id);
export const HEALTH_CASES = Object.freeze([...ALL].sort((a, b) => order(a.suiteId) - order(b.suiteId)));

export const IN_APP_HEALTH_CASES = Object.freeze(HEALTH_CASES.filter(c => c.applicability === APPLICABILITY.CURRENT && !LOCAL_HEALTH_IDS.has(c.id)));
export const ACCEPTANCE_REQUIREMENTS = Object.freeze(HEALTH_CASES.filter(c => !IN_APP_HEALTH_CASES.includes(c)));
