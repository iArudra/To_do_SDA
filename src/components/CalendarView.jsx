import { useState, useEffect } from 'react'
import { api } from '../api'

function CalendarView({ user }) {
    const [tasks, setTasks] = useState([])
    const [groupedTasks, setGroupedTasks] = useState({})

    useEffect(() => {
        if (user) {
            fetchTasks()
        }
    }, [user])

    const fetchTasks = async () => {
        try {
            const data = await api.getTasks(user.email)
            setTasks(data)
            groupTasksByDate(data)
        } catch (error) {
            console.error("Failed to load tasks for calendar", error)
        }
    }

    const groupTasksByDate = (taskList) => {
        const groups = {}
        taskList.forEach(task => {
            if (!task.due_date) {
                const key = "No Due Date"
                if (!groups[key]) groups[key] = []
                groups[key].push(task)
            } else {
                const date = new Date(task.due_date).toLocaleDateString()
                if (!groups[date]) groups[date] = []
                groups[date].push(task)
            }
        })
        setGroupedTasks(groups)
    }

    return (
        <div style={{ height: '100%', overflowY: 'auto', paddingRight: '0.5rem' }}>
            <h2 style={{ marginBottom: '1rem', color: 'var(--primary)' }}>Upcoming Deadlines</h2>
            {Object.keys(groupedTasks).length === 0 ? (
                <p>No deadlines found.</p>
            ) : (
                Object.entries(groupedTasks).sort().map(([date, taskList]) => (
                    <div key={date} style={{ marginBottom: '1.5rem' }}>
                        <h4 style={{
                            borderBottom: '1px solid rgba(255,255,255,0.3)',
                            paddingBottom: '0.5rem',
                            marginBottom: '0.5rem',
                            color: 'var(--text-color)'
                        }}>
                            {date}
                        </h4>
                        {taskList.map(task => (
                            <div key={task.id} style={{
                                padding: '0.5rem',
                                background: 'rgba(255,255,255,0.1)',
                                marginBottom: '0.5rem',
                                borderRadius: '8px',
                                display: 'flex',
                                justifyContent: 'space-between'
                            }}>
                                <span>{task.text}</span>
                                <span style={{ opacity: 0.6, fontSize: '0.8rem' }}>
                                    {new Date(task.due_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                            </div>
                        ))}
                    </div>
                ))
            )}
        </div>
    )
}

export default CalendarView
