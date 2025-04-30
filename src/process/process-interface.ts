import _ from "es-toolkit";
export default interface ProcessInterface {
  shouldRun(): boolean;
  run(): void;
}
