import { metadataService } from "../../services/MetadataService";
import { Item } from "./types";

export const InventoryTooltip: React.FC<{ item: Item }> = ({ item }) => {
  const itemData = metadataService.getItemSync(item.itemId);


  console.log({ item, itemData })
  // Examle item data structure:
  //   {
  //     "itemId": "dagger",
  //     "name": "Dagger",
  //     "description": "A small dagger. Scales with Strength and Haste.",
  //     "rarity": "common",
  //     "value": 10,
  //     "type": "dagger",
  //     "attackSpeed": "normal",
  //     "damageType": "physical",
  //     "stats": {
  //         "strength": 2
  //     },
  //     "scalingRange": {
  //         "strength": {
  //             "min": "F",
  //             "max": "F"
  //         }
  //     }
  // }

  return (
    <div className="flex bg-amber-700">
      <div className="bg-gray-900">
        <header className="flex">
          <img
            src={`https://cdn.onestreamrpg.com/images/items/batSword.png`}
            alt={"Item Icon"}
            className="size-24 m-4"
            style={{
              imageRendering: "pixelated",
            }}
          />
          <section>
            <h2 className="text-lg font-bold">{itemData.name ?? `Unknown Item Name (${item.itemId})`}</h2>
            <p>{itemData.rarity && `${itemData.rarity}`}{itemData.type && `${itemData.rarity ? " " : ""}${itemData.type}`}</p>
            <p>Damage</p>
            <p>Attack speed</p>
            <p>Damage Scaling</p>
            <p>Strength</p>
            <p>Health</p>
          </section>
        </header>
        <main>
          <p>{itemData.description}</p>
        </main>
        <footer className="flex">
          <p>Requirements comming soon...</p>
          {itemData.value && <p className="pl-2 ml-auto text-right">Sell Price: {itemData.value ?? 0}g</p>}
        </footer>
      </div>
    </div>
  );
};


// Mapping

// {
//     "itemId": "dagger",
//     "name": "Dagger",
//     "description": "A small dagger. Scales with Strength and Haste.",
//     "rarity": "common",
//     "value": 10,
//     "type": "dagger",
//     "attackSpeed": "normal",
//     "damageType": "physical",
//     "stats": {
//         "strength": 2
//     },
//     "scalingRange": {
//         "strength": {
//             "min": "F",
//             "max": "F"
//         }
//     }
// }
