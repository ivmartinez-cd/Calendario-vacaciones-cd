import { Routes, Route, Navigate } from 'react-router-dom';
import Absences from './Absences';

export default function Attendance() {
  return (
    <Routes>
      <Route path="/" element={<Absences view="calendar" />} />
      <Route path="/list" element={<Absences view="list" />} />
      <Route path="*" element={<Navigate to="" replace />} />
    </Routes>
  );
}
