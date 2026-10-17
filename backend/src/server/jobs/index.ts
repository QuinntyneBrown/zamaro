/**
 * Every job handler, registered by importing its module. The Worker and the in-memory queue import
 * this file so each job name resolves to its handler.
 */
import './notifications/send-email';

export { jobHandler, registerJob, type JobHandler, type RunningJob } from './registry';
