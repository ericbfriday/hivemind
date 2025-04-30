import keys from "lodash/keys";
function getResourcesIn(
  store: StoreDefinition | Partial<Record<ResourceConstant, any>>,
): ResourceConstant[] {
  return keys(store) as ResourceConstant[];
}

export { getResourcesIn };
