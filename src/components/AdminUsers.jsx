"use client";

import { useState } from "react";
import { promoteUserAction, demoteAdminAction } from "@/app/admin/actions";

export default function AdminUsers({ initialUsers, isSuperAdmin, showToast }) {
  const [users, setUsers] = useState(initialUsers);
  const [busyId, setBusyId] = useState(null);

  async function handlePromote(user) {
    setBusyId(user.id);
    const result = await promoteUserAction(user.id);
    setBusyId(null);
    if (result.errors) {
      showToast(result.errors.form);
      return;
    }
    setUsers((prev) => prev.map((u) => (u.id === user.id ? { ...u, role: "admin" } : u)));
    showToast(`${user.name} is now an admin`);
  }

  async function handleDemote(user) {
    setBusyId(user.id);
    const result = await demoteAdminAction(user.id);
    setBusyId(null);
    if (result.errors) {
      showToast(result.errors.form);
      return;
    }
    setUsers((prev) => prev.map((u) => (u.id === user.id ? { ...u, role: "user" } : u)));
    showToast(`${user.name} is no longer an admin`);
  }

  return (
    <div className="flex flex-col gap-4">
      <h2 className="font-display text-xl font-semibold text-text">
        Users
      </h2>

      <div className="skeu-panel overflow-x-auto rounded-2xl border border-border">
        <table className="w-full text-left text-sm">
          <thead className="text-text-muted">
            <tr>
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Email</th>
              <th className="px-4 py-3 font-medium">Role</th>
              <th className="px-4 py-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} className="border-t border-border">
                <td className="px-4 py-3 font-medium text-text">{user.name}</td>
                <td className="px-4 py-3 text-text-muted">{user.email}</td>
                <td className="px-4 py-3">
                  {user.isSuperAdmin ? (
                    <span className="rounded-full bg-admin px-2.5 py-1 text-xs font-medium text-admin-ink">
                      Original admin
                    </span>
                  ) : user.role === "admin" ? (
                    <span className="rounded-full border border-admin-accent/50 px-2.5 py-1 text-xs font-medium text-admin-accent">
                      Admin
                    </span>
                  ) : (
                    <span className="rounded-full border border-border px-2.5 py-1 text-xs font-medium text-text-muted">
                      User
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 max-md:py-4">
                  <div className="flex justify-end gap-2">
                    {user.role === "user" && (
                      <button
                        type="button"
                        disabled={busyId === user.id}
                        onClick={() => handlePromote(user)}
                        className="skeu-depth focus-ring tap-target rounded-md border border-border px-3 py-1.5 text-xs font-medium text-text hover:border-primary disabled:opacity-60"
                      >
                        Make admin
                      </button>
                    )}
                    {user.role === "admin" && !user.isSuperAdmin && isSuperAdmin && (
                      <button
                        type="button"
                        disabled={busyId === user.id}
                        onClick={() => handleDemote(user)}
                        className="skeu-depth focus-ring tap-target rounded-md border border-error/50 px-3 py-1.5 text-xs font-medium text-error hover:bg-error/10 disabled:opacity-60"
                      >
                        Remove admin
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-10 text-center text-text-muted">
                  No users yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
