import { PHASES, PhaseTimes, PhaseType } from "mafia/src/game/gameState.d";
import translate from "mafia/src/game/lang";
import React from "react";
import { ReactElement } from "react";

export default function PhaseTimesElement(props: { phaseTimes: PhaseTimes }): ReactElement {
    return <section className="phase-times-selector will-menu-colors selector-section">
        <h2>{translate("menu.lobby.timeSettings")}</h2>
        <div className="phase-times">
            {PHASES.map(phase => 
                <PhaseTimeElement key={phase} phase={phase} time={props.phaseTimes[phase]}/>
            )}
        </div>
    </section>
}

function PhaseTimeElement(props: {
    phase: PhaseType,
    time: number,
}): ReactElement {
    const phaseKey = "phase." + props.phase;
    
    return <div>
        <span>{translate(phaseKey)}</span>
        <input
            name={phaseKey}
            type="text"
            value={props.time}
            onChange={() => {}}
        />
    </div>
}