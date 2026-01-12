import { Ability } from "./components/Ability";

export const isEmptyAbility = (ability: Ability) => {
    return ability.abilityId.startsWith("empty");
}