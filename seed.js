require('dotenv').config();
const bcrypt = require('bcryptjs');
const connectDB = require('./config/db');
const User = require('./models/User');
const Trainer = require('./models/Trainer');
const Student = require('./models/Student');
const WorkoutPlan = require('./models/WorkoutPlan');
const Schedule = require('./models/Schedule');
const ProgressEntry = require('./models/ProgressEntry');

async function seed() {
  await connectDB();

  await Promise.all([
    User.deleteMany({}),
    Trainer.deleteMany({}),
    Student.deleteMany({}),
    WorkoutPlan.deleteMany({}),
    Schedule.deleteMany({}),
    ProgressEntry.deleteMany({})
  ]);

  const passwordHash = await bcrypt.hash('password123', 10);
  const users = await User.insertMany([
    { username: 'admin', email: 'admin@fitmanager.com', password: passwordHash, role: 'admin' },
    { username: 'trainer1', email: 'trainer1@fitmanager.com', password: passwordHash, role: 'trainer' },
    { username: 'student1', email: 'student1@gmail.com', password: passwordHash, role: 'student' }
  ]);

  const trainers = await Trainer.insertMany([
    { name: 'Aarav Singh', email: 'aarav@fitmanager.com', specialization: 'Strength Training', experience: 6 },
    { name: 'Meera Das', email: 'meera@fitmanager.com', specialization: 'Cardio & Endurance', experience: 4 }
  ]);

  const students = await Student.insertMany([
    { name: 'Riya Patel', age: 21, fitnessGoal: 'Build muscle mass', trainer: trainers[0]._id },
    { name: 'Karan Nair', age: 24, fitnessGoal: 'Improve cardiovascular fitness', trainer: trainers[1]._id }
  ]);

  await WorkoutPlan.insertMany([
    {
      title: 'Beginner Strength Plan',
      duration: 45,
      trainer: trainers[0]._id,
      exercises: [
        { name: 'Squats', sets: 3, reps: 10 },
        { name: 'Bench Press', sets: 3, reps: 8 }
      ]
    },
    {
      title: 'Cardio Starter Plan',
      duration: 30,
      trainer: trainers[1]._id,
      exercises: [
        { name: 'Treadmill Run', sets: 1, reps: 20 },
        { name: 'Jump Rope', sets: 3, reps: 60 }
      ]
    }
  ]);

  const today = new Date().toISOString().slice(0, 10);
  await Schedule.insertMany([
    { trainer: trainers[0]._id, date: today, time: '09:00' },
    { trainer: trainers[1]._id, date: today, time: '17:00' }
  ]);

  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  await ProgressEntry.insertMany([
    {
      user: users.find((u) => u.username === 'student1')._id,
      date: yesterday,
      weightKg: 68,
      workoutMinutes: 40,
      notes: 'Felt good. Increased reps.',
      exercises: [
        { name: 'Push-ups', sets: 3, reps: 12 },
        { name: 'Squats', sets: 3, reps: 15 }
      ]
    },
    {
      user: users.find((u) => u.username === 'student1')._id,
      date: today,
      weightKg: 67.6,
      workoutMinutes: 30,
      notes: 'Light cardio + mobility.',
      exercises: [{ name: 'Treadmill Run', sets: 1, reps: 20 }]
    }
  ]);

  console.log('Seed complete');
  console.log('Demo login users:');
  users.forEach((u) => console.log(`- ${u.username} (${u.role}) / password123`));
  console.log(`Seeded ${trainers.length} trainers, ${students.length} students, 2 workouts, 2 schedules, progress entries.`);

  process.exit(0);
}

seed().catch((err) => {
  console.error('Seed failed:', err.message);
  process.exit(1);
});
