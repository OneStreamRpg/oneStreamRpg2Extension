export const InventoryTooltip: React.FC = () => {
  return (
    <div className="flex bg-amber-700">
      <div className="bg-green-900">
        <header className="flex">
          <img
            src={`https://cdn.onestreamrpg.com/images/items/batSword.png`}
            alt={"Item Icon"}
            className="size-16 mx-auto"
            style={{
              imageRendering: "pixelated",
            }}
          />
          <section>
            <h2>Name</h2>
            <p>Rarity & Type</p>
            <p>Damage</p>
            <p>Attack speed</p>
            <p>Damage Scaling</p>
            <p>Strength</p>
            <p>Health</p>
          </section>
        </header>
        <main>
          <p>Description</p>
        </main>
        <footer className="flex">
          <p>Requirements</p>
          <p className="pl-2 ml-auto text-right">Sell Price: 1000 Gold</p>
        </footer>
      </div>
    </div>
  );
};
