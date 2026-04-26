import React from 'react';
import AiAdvisor from './AiAdvisor';

export default function TutorView({ data }) {
  if (!data || !data.courses) return null;

  return (
    <div style={{ padding: '1.5rem', paddingBottom: '100px', maxWidth: '800px', margin: '0 auto', height: '100vh', display: 'flex', flexDirection: 'column' }} className="animate-slide-up">
       <h1 style={{ color: 'var(--primary-color)', marginBottom: '1rem' }}>Tutor</h1>
       <div style={{ flex: 1, position: 'relative', display: 'flex', flexDirection: 'column' }}>
         <AiAdvisor courses={data.courses} inline={true} />
       </div>
    </div>
  );
}
