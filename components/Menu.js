export default function Menu({ menu }) {
  const courses = [
    { label: 'Starter', dish: menu.starter, emoji: '🥗', bg: '#f0fdf4' },
    { label: 'Main Course', dish: menu.main, emoji: '🍖', bg: '#fff1f2' },
    { label: 'Dessert', dish: menu.dessert, emoji: '🍫', bg: '#fffbeb' },
  ];

  return (
    <div>
      <h2 style={{ fontSize: '20px', fontFamily: 'Playfair Display, serif', color: '#1f2937', marginBottom: '24px' }}>🍽 Tonight's Menu</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {courses.map((course, i) => (
          <div
            key={i}
            style={{
              background: course.bg,
              borderRadius: '16px',
              padding: '20px',
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
              border: '1px solid rgba(0,0,0,0.05)',
              boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
            }}
          >
            <span style={{ fontSize: '36px' }}>{course.emoji}</span>
            <div>
              <p style={{ color: '#9ca3af', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '2px', margin: '0 0 4px 0', fontWeight: 500 }}>
                {course.label}
              </p>
              <p style={{ fontSize: '18px', fontFamily: 'Playfair Display, serif', color: '#1f2937', margin: 0 }}>
                {course.dish}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}