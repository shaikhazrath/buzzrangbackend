import express from 'express';
import mongoose from 'mongoose';
import session from 'express-session';
import MongoStore from 'connect-mongo';
import cors from 'cors';

import UserRoutes from './routes/userRoute.js';
import ProductsRoutes from './routes/productsRoute.js';
import ClipRoutes from './routes/clipsRoute.js'


const app = express();

app.use(express.json());
app.use(cors());

mongoose
  .connect('mongodb+srv://shaikhazrathali123:hazrath@cluster0.8lea2.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0')
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => console.error('Failed to connect to MongoDB:', err));

app.use(
  session({
    secret: 'shaikhazrath',
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl: 'mongodb+srv://shaikhazrathali123:hazrath@cluster0.8lea2.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0',
      collectionName: 'sessions',
    }),
    cookie: {
      maxAge: 90 * 24 * 60 * 60 * 1000, 
      secure: false,
      httpOnly: true,
    },
  })
);

app.use('/user', UserRoutes);
app.use('/products', ProductsRoutes);
app.use('/clips', ClipRoutes);



const PORT = process.env.PORT || 9000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
