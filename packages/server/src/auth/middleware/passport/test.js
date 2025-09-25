const express = require('express');
const session = require('express-session');
import Redis from 'ioredis'
import { RedisStore } from 'connect-redis'
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;

const app = express();

const redisClient = new Redis({
    host: 'localhost',
    port: 6379,
    password: 'Pa55w.rd',
    tls: undefined
})

const redisStore = new RedisStore({ client: redisClient })
// Middleware setup
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Session configuration với Redis store
app.use(session({
    store: redisStore,
    secret: 'your-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false, maxAge: 24 * 60 * 60 * 1000 } // 24 hours
}));

app.use(passport.initialize());
app.use(passport.session());

// Giả lập database users
const users = [
    { id: 1, username: 'john', password: '123456', email: 'john@example.com' },
    { id: 2, username: 'jane', password: 'abcdef', email: 'jane@example.com' }
];

// Passport Local Strategy
passport.use(new LocalStrategy(
    async (username, password, done) => {
        console.log('🔍 LocalStrategy: Tìm kiếm user:', username);
        
        const user = users.find(u => u.username === username && u.password === password);
        if (user) {
            console.log('✅ User found:', user);
            return done(null, user);
        } else {
            console.log('❌ User không tồn tại hoặc sai mật khẩu');
            return done(null, false);
        }
    }
));

// Serialize user - chỉ lưu user vào session
passport.serializeUser((user, done) => {
    console.log('📦 SerializeUser: Lưu user ID vào session:', user.id);
    done(null, user.id);
});

// Deserialize user - fetch user data từ database dựa trên ID
passport.deserializeUser(async (id, done) => {
    console.log('🔍 DeserializeUser: Tìm user với ID:', id);
    console.log('⚡ Lưu ý: Đây là nơi thường query database, KHÔNG phải Redis session!');
    
    // Đây là nơi bạn query database để lấy user data
    // Redis chỉ lưu session data (như user ID), không lưu full user object
    const user = users.find(u => u.id === parseInt(id));
    
    if (user) {
        console.log('✅ User được deserialize:', user);
        done(null, user);
    } else {
        console.log('❌ Không tìm thấy user');
        done(new Error('User not found'));
    }
});

// Routes
app.post('/login', passport.authenticate('local'), (req, res) => {
    console.log('🎉 Đăng nhập thành công!');
    res.json({ message: 'Login successful', user: req.user });
});

app.get('/profile', (req, res) => {
    if (req.isAuthenticated()) {
        console.log('👤 User đã được deserialize:', req.user);
        res.json({ user: req.user });
    } else {
        res.status(401).json({ message: 'Not authenticated' });
    }
});

app.get('/logout', (req, res, next) => {
    req.logout((err) => {
        if (err) { return next(err); }
        res.json({ message: 'Logged out' });
    });
});

// Route để kiểm tra Redis session data
app.get('/check-session', (req, res) => {
    console.log('🔍 Session data hiện tại:', req.session.cookie);
    res.json({ 
        sessionData: req.session,
        isAuthenticated: req.isAuthenticated()
    });
});

app.listen(3000, () => {
    console.log('🚀 Server chạy trên port 3000');
    console.log('📝 Test commands:');
    console.log('curl -X POST http://localhost:3000/login -d "username=john&password=123456" -H "Content-Type: application/x-www-form-urlencoded"');
});
