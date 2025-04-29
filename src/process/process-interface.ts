import _ from "lodash";
export default interface ProcessInterface {
  shouldRun(): boolean;
  run(): void;
}
