export async function fetchAvailableExams(token) {
  const res = await fetch('/api/student/exams', {
    headers: { Authorization: `Bearer ${token}` },
  })

  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error || 'Failed to load available exams')
  return data
}

export async function fetchExams(token) {
  const res = await fetch('/api/exams', {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) throw new Error('Failed to load exams')
  return res.json()
}

export async function createExam(examData, token) {
  const res = await fetch('/api/exams', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(examData),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error || 'Failed to create exam')
  return data
}

export async function updateExamTiming(id, timingData, token) {
  const res = await fetch(`/api/exams/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(timingData),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error || 'Failed to update exam timing')
  return data
}

export async function publishExam(id, token) {
  const res = await fetch(`/api/exams/${id}/publish`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error || 'Failed to publish exam')
  return data
}

export async function fetchExamQuestions(id, token) {
  const res = await fetch(`/api/exams/${id}/questions`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    const error = new Error(data.error || 'Failed to fetch questions')
    error.status = res.status
    throw error
  }
  return data
}

export async function updateQuestion(id, questionData, token) {
  const res = await fetch(`/api/questions/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(questionData),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error || 'Failed to update question')
  return data
}

export async function deleteQuestion(id, token) {
  const res = await fetch(`/api/questions/${id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error || 'Failed to delete question')
  return data
}

export async function fetchExamReport(id, token) {
  const res = await fetch(`/api/exams/${id}/report`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error || 'Failed to fetch exam report')
  return data
}

export async function fetchExamResults(id, token) {
  const res = await fetch(`/api/exams/${id}/results`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error || 'Failed to fetch exam results')
  return data
}

export async function startExam(id, token) {
  const res = await fetch(`/api/exams/${id}/start`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    const error = new Error(data.error || 'Failed to start exam')
    error.status = res.status
    throw error
  }
  return data
}

export async function submitExamAttempt(id, answers, token) {
  const res = await fetch(`/api/exams/${id}/attempts`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ answers }),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    const error = new Error(data.error || 'Failed to submit exam attempt')
    error.status = res.status
    throw error
  }
  return data
}
