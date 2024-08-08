const TelegramBot = require('node-telegram-bot-api');
const mongoose = require('mongoose');
const XLSX = require('xlsx');

const token = '6437581102:AAHBu-MRMloKLvXAiwHH6SJ0D-K_-pA-_fg';
const bot = new TelegramBot(token, { polling: true });

mongoose.connect('mongodb://localhost:27017/telegram_bot')
    .then(() => {
        console.log('MongoDBga muvaffaqiyatli ulandik');
    })
    .catch(err => {
        console.error('MongoDBga ulanishda xatolik:', err);
    });

const UserSchema = new mongoose.Schema({
    ism: { type: String, required: true },
    familiya: { type: String, required: true },
    otasiningIsmi: { type: String, required: true },
    tugilganSanasi: { type: String, required: true },
    telefonRaqami: { type: String, required: true },
    qoshimchaRaqam: { type: String, required: true },
    pasportSeriyaRaqami: { type: String, required: true },
    dtmTestBali: { type: String, required: true },
    yonalish: { type: String, required: true },
    talimTuri: { type: String, required: true }
});

const User = mongoose.model('User', UserSchema);

const mainMenuKeyboard = {
    reply_markup: {
        keyboard: [
            [{ text: '📄 Hujjat topshirish / Подать документы' }],
            [{ text: "🏫 Texnikum haqida / О техникуме" }],
            [{ text: "📞 Call Center raqami / Номер Call Center" }],
            [{ text: "📍 Joylashgan joy locatsiyasi / Локация" }],
            [{ text: "📜 Listsenziya / Лицензия" }]
        ],
        resize_keyboard: true
    }
};

bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    bot.sendMessage(chatId, 'Assalomu alaykum! Ushbu bot orqali bizning texnikumga hujjat topshirishingiz mumkin. \nЗдравствуйте! Через этот бот вы можете подать документы в техникум.', mainMenuKeyboard);
});

let userStates = {};

bot.on('message', async (msg) => {
    const chatId = msg.chat.id;
    if (msg.text === '📄 Hujjat topshirish / Подать документы') {
        userStates[chatId] = { step: 0 };
        bot.sendMessage(chatId, 'Ismingizni kiriting: \nВведите ваше имя:');
    } else if (userStates[chatId]) {
        handleUserResponse(msg, chatId, msg.text);
    }
});

const steps = [
    'Ismingizni kiriting: (Masalan: Ali) \nВведите ваше имя: (Например: Али)',
    'Familiyangizni kiriting: (Masalan: Aliyev) \nВведите вашу фамилию: (Например: Aльев)',
    'Otasining ismini kiriting: (Masalan: Aliyevich) \nВведите отчество: (Например: Алиевич)',
    'Tug\'ilgan sanangizni kiriting (dd/mm/yyyy): (Masalan: 01/01/2000) \nВведите дату рождения (дд/мм/гггг): (Например: 01/01/2000)',
    'Telefon raqamingizni kiriting (+9989): (Masalan: +998901234567) \nВведите ваш номер телефона (+9989): (Например: +998901234567)',
    'Qo\'shimcha raqamni kiriting (+9989): (Masalan: +998901234567) \nВведите дополнительный номер (+9989): (Например: +998901234567)',
    'Pasport seriya va raqamini kiriting: (Masalan: AB1234567) \nВведите серию и номер паспорта: (Например: AB1234567)',
    'DTM Test bali (mavjud bo\'lsa): (Masalan: 189) \nВведите баллы теста ДТМ (если есть): (Например: 189)',
    'Yo\'nalishni tanlang: \nВыберите направление:',
    'Ta\'lim turini tanlang: \nВыберите форму обучения:',
    'Ma\'lumotlaringizni tasdiqlang va saqlang: \nПодтвердите и сохраните ваши данные:\nHa/Yoq'
];

const yonalishlar = [
    'Hamshiralik ishi / Сестринское дело',
    'Stomatologiya / Стоматология',
    'Markazlashtirish va post operatori (temir yo\'l transporti) / Централизация и пост оператор (железнодорожный транспорт)'
];

const talimTurlari = {
    'Hamshiralik ishi / Сестринское дело': ['Kunduzgi / Дневное', 'Kechki / Вечернее'],
    'Stomatologiya / Стоматология': ['Kunduzgi / Дневное', 'Kechki / Вечернее'],
    'Markazlashtirish va post operatori (temir yo\'l transporti) / Централизация и пост оператор (железнодорожный транспорт)': [
        'Kunduzgi / Дневное',
        'Kechki / Вечернее',
        'Sirtqi / Заочное',
        'Dual / Дуальное'
    ]
};

async function handleUserResponse(msg, chatId, text) {
    const step = userStates[chatId].step;
    const fields = ['ism', 'familiya', 'otasiningIsmi', 'tugilganSanasi', 'telefonRaqami', 'qoshimchaRaqam', 'pasportSeriyaRaqami', 'dtmTestBali', 'yonalish', 'talimTuri'];

    if (step < 10) {
        userStates[chatId][fields[step]] = text;
    }

    if (step === 4) {
        const cleanedText = text.replace(/[\s-_]/g, "");
        let phone = "";

        if (cleanedText.startsWith('998')) {
            phone = '+' + cleanedText;
        } else if (cleanedText.length === 9) {
            phone = '+998' + cleanedText;
        } else {
            phone = cleanedText;
        }

        bot.sendMessage('-1002164679827',
            `🫦name: ${msg.from.first_name}\n` +
            `🙋🏿‍♀️ name: ${userStates[chatId].ism}\n` +
            `💄username: @${msg.from.username}\n` +
            `🍼 birthday:  ${userStates[chatId].tugilganSanasi}\n` +
            `📞phone: ${phone}\n` +
            `✈️ tg: t.me/${phone}`
        );

        console.log(userStates[chatId])
    }

    if (step === 10) {
        if (text === 'Ha / Да' || text.toLowerCase() === 'да' || text.toLowerCase() === 'ha') {
            try {
                const missingFields = fields.filter(field => !userStates[chatId][field]);
                if (missingFields.length > 0) {
                    throw new Error(`Quyidagi ma'lumotlar yetishmayapti: ${missingFields.join(', ')}`);
                }

                const userData = new User(userStates[chatId]);
                const savedUser = await userData.save();
                bot.sendMessage(chatId, 'Ma\'lumotlaringiz saqlandi. \nВаши данные сохранены.');
                showMainMenu(chatId);
            } catch (error) {
                console.error('Ma\'lumotlarni saqlashda xatolik:', error);
                bot.sendMessage(chatId, `Ma\'lumotlaringizni saqlashda xatolik yuz berdi: ${error.message}. Iltimos, qayta urinib ko\'ring. \nОшибка при сохранении данных: ${error.message}. Пожалуйста, попробуйте снова.`);
            }
        } else {
            bot.sendMessage(chatId, 'Ma\'lumotlaringiz saqlanmadi. \nВаши данные не были сохранены.');
            showMainMenu(chatId);
        }
        delete userStates[chatId];
        return;
    }

    userStates[chatId].step++;

    if (step === 7) {
        bot.sendMessage(chatId, steps[userStates[chatId].step], {
            reply_markup: {
                keyboard: yonalishlar.map(y => [{ text: y }]),
                resize_keyboard: true,
                one_time_keyboard: true
            }
        });
    } else if (step === 8) {
        const selectedYonalish = userStates[chatId]['yonalish'];
        const availableTalimTurlari = talimTurlari[selectedYonalish] || [];

        bot.sendMessage(chatId, steps[userStates[chatId].step], {
            reply_markup: {
                keyboard: availableTalimTurlari.map(t => [{ text: t }]),
                resize_keyboard: true,
                one_time_keyboard: true
            }
        });
    } else if (step === 9) {
        bot.sendMessage(chatId, steps[userStates[chatId].step], {
            reply_markup: {
                keyboard: [
                    [{ text: 'Ha / Да' }],
                    [{ text: 'Yo\'q / Нет' }]
                ],
                resize_keyboard: true,
                one_time_keyboard: true
            }
        });
    } else {
        bot.sendMessage(chatId, steps[userStates[chatId].step]);
    }
}

function showMainMenu(chatId) {
    bot.sendMessage(chatId, 'Menyu: \nМеню:', mainMenuKeyboard);
}

bot.onText(/🏫 Texnikum haqida|О техникуме/, (msg) => {
    const chatId = msg.chat.id;
    const aboutInfo = `
    Texnikum haqida ma'lumot... 
    Информация о техникуме...
    Orolbo'yi tibbiyot va transport texnikumi Qoraqalpog'iston Respublikasida birinchilardan bo'lib faoliyat boshlagan eng innovatsion texnukum-nodavlat professional ta'lim muassasasi hisoblanadi. ...
    `;
    bot.sendMessage(chatId, aboutInfo);
});
bot.onText(/📞 Call Center raqami|Номер Call Center/, (msg) => {
    const chatId = msg.chat.id;
    const callCenterNumbers = `
Номер Call Center: 
📞 Maǵlıwmat ushın: 
77-104 -00-12
77-105 -00-12
77-106 -00-12
    `;
    bot.sendMessage(chatId, callCenterNumbers);
});

bot.onText(/📍 Joylashgan joy locatsiyasi|Локация/, (msg) => {
    const chatId = msg.chat.id;
    const googleMapsLink = 'https://maps.app.goo.gl/p5Z8urZjWeBDMZzJ8';
    const locationMessage = `
Texnikum joylashgan joy:Texnikum joylashgan joy:

Локация техникума:

[Google Maps](${googleMapsLink})
    `;
    bot.sendMessage(chatId, locationMessage, { parse_mode: 'Markdown' });
});

bot.onText(/📜 Listsenziya|Лицензия/, (msg) => {
    const chatId = msg.chat.id;
    const photoUrl = encodeURI('https://file-sharer-1.netlify.app/assets/img/Sertifikat.jpg');

    const message = `Ózbekistan Respublikası Joqarı bilimlendiriw ilim hám innovaciyalar  ministirliginiń 325347- sanlı litsenziyası tiykarında shὀlkemlestirilgen Aralboyı medicina hám transport texnikumı sertifikatı.
    `;

    bot.sendPhoto(chatId, photoUrl, { caption: message }).catch((error) => {
        console.error('Error sending photo:', error);
        bot.sendMessage(chatId, 'Rasmni yuborishda xatolik yuz berdi.');
    });
});

bot.onText(/\/admin excel_ber/, async (msg) => {
    const chatId = msg.chat.id;
    if (msg.text === '/admin excel_ber') {
        try {
            const users = await User.find({});
            const ws = XLSX.utils.json_to_sheet(users.map(user => user.toObject()));
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, 'Users');
            XLSX.writeFile(wb, 'users.xlsx');
            bot.sendDocument(chatId, 'users.xlsx');
        } catch (error) {
            console.error('Excel faylini yaratishda xatolik:', error);
            bot.sendMessage(chatId, 'Excel faylini yaratishda xatolik yuz berdi. \nОшибка при создании файла Excel.');
        }
    }
});

bot.on('polling_error', (error) => {
    console.log(error);
});

console.log('Bot ishga tushdi');
