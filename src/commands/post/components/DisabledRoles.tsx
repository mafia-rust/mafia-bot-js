import StyledText from "./StyledText";
import translate from "mafia/src/game/lang";
import { getAllRoles } from "mafia/src/game/roleListState.d";
import { Role } from "mafia/src/game/roleState.d";
import React, { ReactElement, useCallback } from "react";

export function DisabledRolesDisplay(props: { disabledRoles: Role[] }): ReactElement {
    const isDisabled = useCallback((role: Role) => props.disabledRoles.includes(role), [props.disabledRoles]);

    const roleTextElement = (role: Role) => {
        return <StyledText 
            className={isDisabled(role) ? "keyword-disabled" : undefined}
        >
            {translate("role."+role+".name")}
        </StyledText>
    }

    return <div>
        {getAllRoles().map((role, i) => 
            <div key={i} className={"disabled-role-element" + (isDisabled(role) ? " disabled" : "")}>
                {roleTextElement(role)}
            </div>
        )}
    </div>
}

export default function DisabledRoleElement(props: { disabledRoles: Role[] }): ReactElement {
    return <div className="role-specific-colors selector-section">
        <h2>{translate("menu.lobby.excludedRoles")}</h2>

        <DisabledRolesDisplay disabledRoles={props.disabledRoles}/>
    </div>
}