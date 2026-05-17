"use client";

import { useState } from "react";
import Link from "next/link";
import { Users, Mail, Calendar, UserSearch } from "lucide-react";
import StatusBadge from "@/components/StatusBadge/StatusBadge";
import teamStyles from "./Team.module.css";

export default function TeamListClient({ teamMembers }: { teamMembers: any[] }) {
  const [searchQuery, setSearchQuery] = useState("");
  
  const filteredMembers = teamMembers.filter(member => 
    member.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    member.role.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className={teamStyles.teamTableWrapper}>
      <div className={teamStyles.tableHeader}>
        <div className={teamStyles.searchBar}>
          <UserSearch size={16} className={teamStyles.searchIcon} />
          <input 
            type="text" 
            placeholder="Search team..." 
            className={teamStyles.searchInput} 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <button className="btn btn-secondary" disabled title="Coming soon"><Users size={14}/> Filter</button>
      </div>
      <table className={teamStyles.table}>
        <thead>
          <tr>
            <th>EMPLOYEE</th>
            <th>GOAL STATUS</th>
            <th>LAST 1:1</th>
            <th>ACTIONS</th>
          </tr>
        </thead>
        <tbody>
          {filteredMembers.length === 0 ? (
            <tr>
              <td colSpan={4} className={teamStyles.emptyCell}>No direct reports found.</td>
            </tr>
          ) : (
            filteredMembers.map(member => {
              const hasSubmitted = member.goals.some((g: any) => g.status === "SUBMITTED");
              const isLocked = member.goals.length > 0 && member.goals.every((g: any) => g.status === "LOCKED");
              
              let goalStatus = "NOT_STARTED";
              if (hasSubmitted) goalStatus = "SUBMITTED";
              else if (isLocked) goalStatus = "LOCKED";
              else if (member.goals.length > 0) goalStatus = "DRAFT";

              const mailtoLink = `mailto:${member.email}?subject=AtomQuest%20Goal%20Review&body=Hi%20${encodeURIComponent(member.name)},%0A%0AI'd%20like%20to%20discuss%20your%20current%20AtomQuest%20goals.%0A%0AThanks.`;
              const calendarLink = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=1:1+Sync+with+${encodeURIComponent(member.name)}&details=Quarterly+goal+review.&add=${encodeURIComponent(member.email)}`;

              return (
                <tr key={member.id}>
                  <td>
                    <div className={teamStyles.employeeCell}>
                      <div className={teamStyles.avatar}>
                        {member.name.substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <Link href={`/dashboard/team/${member.id}`} className={teamStyles.employeeName}>
                          {member.name}
                        </Link>
                        <div className={teamStyles.employeeRole}>{member.role.toLowerCase()}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    {hasSubmitted ? (
                      <div className={teamStyles.actionRequired}>Action Required</div>
                    ) : (
                      <StatusBadge status={goalStatus} size="sm" />
                    )}
                  </td>
                  <td className={teamStyles.mutedText}>2 days ago</td>
                  <td>
                    <div className={teamStyles.rowActions}>
                      <Link href={`/dashboard/team/${member.id}`} className="btn btn-secondary" style={{ padding: "0.25rem 0.5rem", fontSize: "0.75rem" }}>
                        Review Goals
                      </Link>
                      <a href={mailtoLink} className={teamStyles.iconBtn} title="Email" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none' }}>
                        <Mail size={16} />
                      </a>
                      <a href={calendarLink} target="_blank" rel="noreferrer" className={teamStyles.iconBtn} title="Schedule 1:1" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none' }}>
                        <Calendar size={16} />
                      </a>
                    </div>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}
