import { useState, useEffect } from 'react'
import TaskItem from './TaskItem'
import { api } from '../api'

function TodoList({ user }) {
    const [tasks, setTasks] = useState([])
    const [newTask, setNewTask] = useState('')
    const [category, setCategory] = useState('Personal')
    const [notes, setNotes] = useState('')
    const [dueDate, setDueDate] = useState('')
    const [exitingIds, setExitingIds] = useState([])
    const [loading, setLoading] = useState(true)

    // Load tasks from Backend
    useEffect(() => {
        if (user && user.email) {
            fetchTasks()
        }
    }, [user])

    const fetchTasks = async () => {
        try {
            const data = await api.getTasks(user.email)
            setTasks(data)
        } catch (error) {
            console.error("Failed to fetch tasks", error)
        } finally {
            setLoading(false)
        }
    }

    const addTask = async (e) => {
        e.preventDefault()
        if (!newTask.trim()) return

        const taskData = {
            user: user.email,
            text: newTask,
            category,
            notes,
            due_date: dueDate
        }

        try {
            const res = await api.addTask(taskData)
            const newTaskObj = {
                id: res.id,
                ...taskData,
                completed: false,
                created_at: new Date().toISOString() // Optimistic update usually uses backend response but this is fine
            }
            setTasks(prev => [newTaskObj, ...prev])
            // Reset form
            setNewTask('')
            setNotes('')
            setDueDate('')
        } catch (error) {
            console.error("Failed to add task", error)
        }
    }

    const toggleTask = async (id) => {
        const task = tasks.find(t => t.id === id)
        if (!task) return

        // Optimistic UI update
        const updatedStatus = !task.completed
        setTasks(prev => prev.map(t => t.id === id ? { ...t, completed: updatedStatus } : t))

        try {
            await api.updateTask(id, { completed: updatedStatus })
        } catch (error) {
            console.error("Failed to update task", error)
            // Revert on error
            setTasks(prev => prev.map(t => t.id === id ? { ...t, completed: !updatedStatus } : t))
        }
    }

    const deleteTask = (id) => {
        setExitingIds(prev => [...prev, id])
        setTimeout(async () => {
            try {
                await api.deleteTask(id)
                setTasks(prev => prev.filter(t => t.id !== id))
            } catch (error) {
                console.error("Failed to delete task", error)
            } finally {
                setExitingIds(prev => prev.filter(eid => eid !== id))
            }
        }, 500)
    }

    if (loading) return <div style={{ textAlign: 'center', marginTop: '20px' }}>Loading tasks...</div>

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <form onSubmit={addTask} style={{ marginBottom: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ position: 'relative' }}>
                    <input
                        type="text"
                        placeholder="Add a new task..."
                        value={newTask}
                        onChange={(e) => setNewTask(e.target.value)}
                        required
                        style={{
                            width: '100%',
                            padding: '1rem',
                            paddingRight: '3rem',
                            borderRadius: '12px',
                            background: 'rgba(255,255,255,0.2)',
                            color: 'var(--text-color)',
                            fontSize: '1rem',
                            border: '1px solid transparent'
                        }}
                    />
                    <button
                        type="submit"
                        disabled={!newTask.trim()}
                        style={{
                            position: 'absolute',
                            right: '0.5rem',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            background: 'var(--primary)',
                            color: '#fff',
                            width: '2rem',
                            height: '2rem',
                            borderRadius: '50%',
                            border: 'none',
                            cursor: 'pointer',
                            opacity: newTask.trim() ? 1 : 0.5
                        }}
                    >
                        +
                    </button>
                </div>

                {/* Extra Fields */}
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <select
                        value={category}
                        onChange={e => setCategory(e.target.value)}
                        style={{ padding: '0.5rem', borderRadius: '8px', border: 'none', background: 'rgba(255,255,255,0.3)', color: 'var(--text-color)' }}
                    >
                        <option value="Personal">Personal</option>
                        <option value="Work">Work</option>
                        <option value="Study">Study</option>
                        <option value="Health">Health</option>
                    </select>

                    <input
                        type="datetime-local"
                        value={dueDate}
                        onChange={e => setDueDate(e.target.value)}
                        style={{ padding: '0.5rem', borderRadius: '8px', border: 'none', background: 'rgba(255,255,255,0.3)', color: 'var(--text-color)' }}
                    />
                </div>

                <textarea
                    placeholder="Notes (optional)"
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    rows="2"
                    style={{
                        padding: '0.5rem',
                        borderRadius: '8px',
                        border: 'none',
                        background: 'rgba(255,255,255,0.2)',
                        color: 'var(--text-color)',
                        resize: 'none',
                        fontFamily: 'inherit'
                    }}
                />
            </form>

            <div style={{ flex: 1, overflowY: 'auto' }}>
                {tasks.length === 0 ? (
                    <p style={{ textAlign: 'center', opacity: 0.5, marginTop: '2rem' }}>
                        No tasks yet. Enjoy the view!
                    </p>
                ) : (
                    tasks.map(task => (
                        <TaskItem
                            key={task.id}
                            task={task}
                            onToggle={toggleTask}
                            onDelete={deleteTask}
                            isExiting={exitingIds.includes(task.id)}
                        />
                    ))
                )}
            </div>
        </div>
    )
}

export default TodoList
