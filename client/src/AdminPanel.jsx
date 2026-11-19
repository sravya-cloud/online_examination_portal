import { useEffect, useState } from 'react'

// FR-03, FR-23, FR-24, NFR-12: administrator screens.
async function adminRequest(token, path, options = {}) {
  const res = await fetch(`/api/admin${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    const detail = data.details ? ` ${Object.values(data.details).join(' ')}` : ''
    throw new Error(`${data.error || 'Request failed'}${detail}`)
  }
  return data
}

const SECTIONS = [
  ['users', 'Users & roles'],
  ['settings', 'System settings'],
  ['permissions', 'Role permissions'],
  ['audit', 'Audit log'],
]

export default function AdminPanel({ token, currentUserId }) {
  const [section, setSection] = useState('users')

  return (
    <section style={{ marginTop: '1rem' }}>
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
        {SECTIONS.map(([key, label]) => (
          <button
            key={key}
            type="button"
            style={{ fontWeight: section === key ? 'bold' : 'normal' }}
            onClick={() => setSection(key)}
          >
            {label}
          </button>
        ))}
      </div>
      {section === 'users' && <UsersSection token={token} currentUserId={currentUserId} />}
      {section === 'settings' && <SettingsSection token={token} />}
      {section === 'permissions' && <PermissionsSection token={token} />}
      {section === 'audit' && <AuditSection token={token} />}
    </section>
  )
}

function useAdminData(token, path, version) {
  const [state, setState] = useState({ data: null, error: null })
  useEffect(() => {
    let active = true
    adminRequest(token, path)
      .then((data) => active && setState({ data, error: null }))
      .catch((err) => active && setState({ data: null, error: err.message }))
    return () => {
      active = false
    }
  }, [token, path, version])
  return state
}

function UsersSection({ token, currentUserId }) {
  const [version, setVersion] = useState(0)
  const [message, setMessage] = useState('')
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'STUDENT' })
  const { data, error } = useAdminData(token, '/users', version)

  async function run(action, success) {
    setMessage('')
    try {
      await action()
      setMessage(success)
      setVersion((v) => v + 1)
    } catch (err) {
      setMessage(err.message)
    }
  }

  const patch = (id, body, success) =>
    run(() => adminRequest(token, `/users/${id}`, { method: 'PATCH', body }), success)

  return (
    <div>
      <h2>Users &amp; roles</h2>
      {message && <p role="status">{message}</p>}
      {error && <p className="form-error">{error}</p>}
      {data && (
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Status</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {data.users.map((u) => (
              <tr key={u.id}>
                <td>{u.name}</td>
                <td>{u.email}</td>
                <td>
                  <select
                    value={u.role}
                    disabled={u.id === currentUserId}
                    aria-label={`Role for ${u.email}`}
                    onChange={(e) => patch(u.id, { role: e.target.value }, 'Role updated.')}
                  >
                    <option>STUDENT</option>
                    <option>TEACHER</option>
                    <option>ADMIN</option>
                  </select>
                </td>
                <td>{u.isActive ? 'Active' : 'Disabled'}</td>
                <td>
                  {u.id !== currentUserId && (
                    <button
                      type="button"
                      onClick={() =>
                        patch(
                          u.id,
                          { isActive: !u.isActive },
                          u.isActive ? 'User disabled.' : 'User enabled.'
                        )
                      }
                    >
                      {u.isActive ? 'Disable' : 'Enable'}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <h3>Add a user</h3>
      <form
        className="login-form"
        onSubmit={(e) => {
          e.preventDefault()
          run(
            () => adminRequest(token, '/users', { method: 'POST', body: form }),
            'User created.'
          ).then(() => setForm({ name: '', email: '', password: '', role: 'STUDENT' }))
        }}
      >
        <label>
          Name
          <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
        </label>
        <label>
          Email
          <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
        </label>
        <label>
          Password (8+ characters)
          <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required minLength={8} />
        </label>
        <label>
          Role
          <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
            <option>STUDENT</option>
            <option>TEACHER</option>
            <option>ADMIN</option>
          </select>
        </label>
        <button type="submit">Create user</button>
      </form>
    </div>
  )
}

function SettingsSection({ token }) {
  const [version, setVersion] = useState(0)
  const [message, setMessage] = useState('')
  const [draft, setDraft] = useState({})
  const { data, error } = useAdminData(token, '/settings', version)

  async function save(e) {
    e.preventDefault()
    setMessage('')
    const body = {}
    for (const [key, spec] of Object.entries(data.definitions)) {
      if (draft[key] === undefined) continue
      body[key] = spec.type === 'integer' ? Number(draft[key]) : draft[key]
    }
    if (Object.keys(body).length === 0) return setMessage('Nothing to save.')
    try {
      await adminRequest(token, '/settings', { method: 'PUT', body })
      setDraft({})
      setMessage('Settings saved.')
      setVersion((v) => v + 1)
    } catch (err) {
      setMessage(err.message)
    }
  }

  return (
    <div>
      <h2>System settings</h2>
      {message && <p role="status">{message}</p>}
      {error && <p className="form-error">{error}</p>}
      {data && (
        <form className="login-form" onSubmit={save}>
          {Object.entries(data.definitions).map(([key, spec]) => (
            <label key={key}>
              {spec.label}
              <input
                type={spec.type === 'integer' ? 'number' : spec.type === 'email' ? 'email' : 'text'}
                value={draft[key] ?? data.settings[key]}
                onChange={(e) => setDraft({ ...draft, [key]: e.target.value })}
              />
            </label>
          ))}
          <button type="submit">Save settings</button>
        </form>
      )}
    </div>
  )
}

function PermissionsSection({ token }) {
  const [version, setVersion] = useState(0)
  const [message, setMessage] = useState('')
  const { data, error } = useAdminData(token, '/permissions', version)

  async function toggle(role, permission, granted) {
    setMessage('')
    try {
      await adminRequest(token, '/permissions', {
        method: 'PUT',
        body: { role, permission, granted },
      })
      setMessage('Permission updated. It applies to this role immediately.')
      setVersion((v) => v + 1)
    } catch (err) {
      setMessage(err.message)
    }
  }

  return (
    <div>
      <h2>Role permissions</h2>
      <p>Managing users, settings, permissions and the audit log always stays with administrators.</p>
      {message && <p role="status">{message}</p>}
      {error && <p className="form-error">{error}</p>}
      {data && (
        <table>
          <thead>
            <tr>
              <th>Permission</th>
              {Object.keys(data.permissions).map((role) => (
                <th key={role}>{role}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Object.entries(data.catalog).map(([permission, description]) => (
              <tr key={permission}>
                <td>
                  <strong>{permission}</strong>
                  <br />
                  {description}
                </td>
                {Object.entries(data.permissions).map(([role, granted]) => (
                  <td key={role}>
                    <input
                      type="checkbox"
                      aria-label={`${role} can ${permission}`}
                      checked={granted[permission]}
                      onChange={(e) => toggle(role, permission, e.target.checked)}
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}

function AuditSection({ token }) {
  const { data, error } = useAdminData(token, '/audit-logs?limit=100', 0)

  return (
    <div>
      <h2>Audit log</h2>
      {error && <p className="form-error">{error}</p>}
      {data && data.logs.length === 0 && <p>No actions recorded yet.</p>}
      {data && data.logs.length > 0 && (
        <table>
          <thead>
            <tr>
              <th>When</th>
              <th>Admin/user id</th>
              <th>Action</th>
              <th>Target</th>
              <th>Details</th>
            </tr>
          </thead>
          <tbody>
            {data.logs.map((log) => (
              <tr key={log.id}>
                <td>{new Date(log.createdAt).toLocaleString()}</td>
                <td>{log.actorId ?? '-'}</td>
                <td>{log.action}</td>
                <td>
                  {log.entityType}
                  {log.entityId ? ` #${log.entityId}` : ''}
                </td>
                <td>{log.details ? JSON.stringify(log.details) : ''}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
