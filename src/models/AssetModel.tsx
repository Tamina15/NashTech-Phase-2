import { AssetState, Location } from "../utils/Enum";
import { CategoryModel } from "./CategoryModel";

export type AssetModel = {
    id: number;
    assetCode: string;
    assetName: string;
    category: CategoryModel;
    specification: string;
    installedDate: Date;
    location: Location;
    state: AssetState;
}
export type AssetCreateModel = {
  assetName: string;
  categoryName: string;
  specification: string;
  installDate: string;
  assetState: string;
};
