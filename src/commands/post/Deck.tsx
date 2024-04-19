import React from "react";
import { ReactElement } from "react";
import { GameMode } from "mafia/src/game/localStorage";
import OutlineList from "./components/OutlineList";
import DisabledRolesElement from "./components/DisabledRoles";
import PhaseTimesElement from "./components/PhaseTimes";

export default function Deck(props: { 
    gameMode: GameMode,
    creator: string
}): ReactElement {
    return <div className="deck lm">
        <header>
            <h1>{props.gameMode.name}</h1>
            <h3>{props.creator}</h3>
        </header>
        <main>
            <div>
                <OutlineList roleList={props.gameMode.roleList}/>
            </div>
            <div>
                <PhaseTimesElement phaseTimes={props.gameMode.phaseTimes}/>
                <DisabledRolesElement disabledRoles={props.gameMode.disabledRoles}/>
            </div>
        </main>
    </div>
}