import { useState } from 'react'
import PropTypes from 'prop-types';

function TaskItem({ task, onToggle, onDelete, isExiting }) {
    const [isHovered, setIsHovered] = useState(false)

    const formatDate = (dateString) => {
        if (!dateString) return ''
        const date = new Date(dateString)
        return date.toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit'
        })
    }

    // Determine category color
    const getCategoryColor = (cat) => {
        switch (cat) {
            case 'Work': return '#4ecdc4';
            case 'Study': return '#ff6b6b';
            case 'Health': return '#95a5a6';
            default: return '#ffe66d'; // Personal/Default
        }
    }

    return (
        <div
            className={`task-item ${isExiting ? 'exit' : ''}`}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '0.5rem',
                padding: '1rem',
                marginBottom: '0.8rem',
                background: 'rgba(255,255,255,0.15)',
                backdropFilter: 'blur(5px)',
                borderRadius: '12px',
                border: '1px solid rgba(255,255,255,0.1)',
                transition: 'all 0.3s ease',
                textDecoration: task.completed ? 'line-through' : 'none',
                opacity: task.completed ? 0.7 : 1,
                cursor: 'pointer',
                position: 'relative',
                overflow: 'hidden'
            }}
            onClick={() => onToggle(task.id)}
        >
            {/* Category Indicator */}
            {task.category && (
                <div style={{
                    position: 'absolute',
                    left: 0,
                    top: 0,
                    bottom: 0,
                    width: '4px',
                    background: getCategoryColor(task.category)
                }} />
            )}

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <input
                        type="checkbox"
                        checked={task.completed}
                        onChange={() => onToggle(task.id)}
                        onClick={(e) => e.stopPropagation()}
                        style={{
                            width: '20px',
                            height: '20px',
                            cursor: 'pointer',
                            accentColor: 'var(--primary)'
                        }}
                    />
                    <span style={{ fontSize: '1.1rem', fontWeight: 500 }}>{task.text}</span>
                </div>

                <button
                    onClick={(e) => {
                        e.stopPropagation()
                        onDelete(task.id)
                    }}
                    style={{
                        opacity: isHovered || window.matchMedia('(hover: none)').matches ? 1 : 0,
                        background: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: '1.2rem',
                        padding: '0.2rem',
                        transition: 'opacity 0.2s',
                        color: 'var(--primary)'
                    }}
                >
                    ×
                </button>
            </div>

            {(task.due_date || task.notes) && (
                <div style={{ fontSize: '0.85rem', color: 'var(--text-color)', opacity: 0.8, display: 'flex', gap: '1rem', flexWrap: 'wrap', paddingLeft: '2.5rem' }}>
                    {task.due_date && (
                        <span>📅 {formatDate(task.due_date)}</span>
                    )}
                </div>
            )}
            {task.notes && (
                <div style={{ fontSize: '0.85rem', opacity: 0.7, fontStyle: 'italic', paddingLeft: '2.5rem' }}>
                    📝 {task.notes}
                </div>
            )}
        </div>
    )
}

TaskItem.propTypes = {
    task: PropTypes.object.isRequired,
    onToggle: PropTypes.func.isRequired,
    onDelete: PropTypes.func.isRequired,
    isExiting: PropTypes.bool
};

export default TaskItem
