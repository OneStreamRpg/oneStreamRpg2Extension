import { useState } from "react";

export const WorldInteractionLayer: React.FC = () => {
  return (
    <section
      className="size-full bg-cover bg-center bg-no-repeat"
      style={{
        backgroundImage: 'url(/media/img/layout/game_placeholder.jpg)'
      }}
    >
      <ExampleItem />

      <ExampleItem />

      <ExampleItem />

      <ExampleItem />

      <ExampleItem />
    </section>
  );
};

export const ExampleItem = () => {
  const [color, setColor] = useState("red");

  return (
    <div
      onClick={() => setColor(color === "red" ? "blue" : "red")}
      className="pointer-events-auto hover:bg-amber-100"
      style={{
        width: 100,
        height: 100,
        backgroundColor: color,
        zIndex: -1,
        top: 50,
        left: 20,
        opacity: 0.2,
      }}
    >
      World Interaction
    </div>
  );
};
