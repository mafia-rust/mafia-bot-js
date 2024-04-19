import translate from "mafia/src/game/lang";
import { FACTIONS, ROLE_SETS, RoleList, RoleOutline, RoleOutlineOption, getAllRoles, translateRoleOutlineOption } from "mafia/src/game/roleListState.d";
import { Role } from "mafia/src/game/roleState.d";
import React, { ReactElement } from "react";


export default function OutlineListElement(props: { roleList: RoleList } ): ReactElement {
    return <section className="graveyard-menu-colors selector-section">
        <h2>{translate("menu.lobby.roleList")}</h2>
        <div className="role-list-setter-list">
            {props.roleList.map((outline, index) => {
                return <div key={index} >
                    <div className="role-list-setter-outline-div">
                        <RoleOutlineElement
                            roleOutline={outline}
                            key={index}
                        />
                    </div>
                </div>
            })}
        </div>
    </section>
}

function RoleOutlineElement(props: { roleOutline: RoleOutline }): ReactElement {
    if(props.roleOutline.type === "any") {
        return <div className="role-picker">
            <RoleOutlineOptionElement
                roleOutlineOption={"any"}
            />
        </div>
    }else{
        return <div className="role-picker">
            {props.roleOutline.options.map((option, index) => {
                return (
                    <div key={index} className="role-picker-option">
                        <RoleOutlineOptionElement
                            roleOutlineOption={option}
                        />
                    </div>
                )
            })}
        </div>
        
    }
}

function RoleOutlineOptionElement(props: { roleOutlineOption: RoleOutlineOption | "any" } ): ReactElement {
    return <select
        value={JSON.stringify(props.roleOutlineOption)} 
        onChange={() => {}}
    >
        <option key={"any"} value="any">
            {translateRoleOutlineOptionOrAny("any")}
        </option>
        {FACTIONS.map((faction) => {
            return <option key={faction} value={JSON.stringify({type: "faction", faction: faction})}>
                {translateRoleOutlineOptionOrAny({type: "faction", faction: faction})}
            </option>
        })}
        {ROLE_SETS.map((roleSet) => {
            return <option key={roleSet} value={JSON.stringify({type: "roleSet", roleSet: roleSet})}>
                {translateRoleOutlineOptionOrAny({type: "roleSet", roleSet: roleSet})}
            </option>
        })}
        {getAllRoles().map((role) => {
            return <option key={role} value={JSON.stringify({type: "role", role: role})}>
                {translateRoleOutlineOptionOrAny({type: "role", role: role as Role})}
            </option>
        })}
    </select>        
}

function translateRoleOutlineOptionOrAny(roleOutlineOption: RoleOutlineOption | "any"): string {
    if(roleOutlineOption === "any") {
        return translate("any");
    }else
        return translateRoleOutlineOption(roleOutlineOption);
}
