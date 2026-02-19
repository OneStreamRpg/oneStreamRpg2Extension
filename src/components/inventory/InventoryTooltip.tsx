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
    <div className="w-80">
      <header className="flex border-b-2 border-gray-500">
        <img
          src={`https://cdn.onestreamrpg.com/images/items/batSword.png`}
          alt={"PLACEHOLDER"}
          className="size-24 m-4"
          style={{
            imageRendering: "pixelated",
          }}
        />
        <section>
          <h2 className="text-lg font-bold" title={itemData.itemId ?? item.itemId}>{itemData.name ?? `Unknown Item Name (${item.itemId})`}</h2>
          <p>{itemData.rarity && `${itemData.rarity}`}{itemData.type && `${itemData.rarity ? " " : ""}${itemData.type}`}</p>
          {itemData.damageType && <p>{itemData.damageType}</p>}
          {itemData.attackSpeed && <p>{itemData.attackSpeed}</p>}
          <p className="italic">Damage Scaling</p>
          <p className="italic">Strength</p>
          <p className="italic">Health</p>
        </section>
      </header>
      <main className="border-b-2 border-gray-500">
        {itemData.stats && <div className="border-b-2 border-gray-500">{Object.entries<"string">(itemData.stats).map(([statKey, statValue]) => (
          <p key={statKey}>{statKey.charAt(0).toUpperCase() + statKey.slice(1)}: {statValue}</p>
        ))}</div>}
        <p>{itemData.description}</p>
      </main>
      <footer className="flex">
        <p className="text-sm text-gray-500">Requirements</p>
        {itemData.value && <p className="pl-2 ml-auto text-right">Sell Price: {itemData.value ?? 0}g</p>}
      </footer>
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
