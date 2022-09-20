const socket = io(); // io is provided by the socket.io client side script, it connects to the server

// html elements
const messageForm = document.getElementById('sendMessage');
const sendLocationBtn = document.getElementById('sendLocation');
const sendMessageBtn = document.getElementById('sendMessageBtn');
const messages = document.getElementById('messages');
const sidebar = document.getElementById('sidebar');

// templates
const messageTemplate = document.getElementById('message-template').innerHTML;
const locationMessageTemplate = document.getElementById('location-message-template').innerHTML;
const sidebarTemplate = document.getElementById('sidebar-template').innerHTML;

// Options
const { username, room } = Qs.parse(location.search, { ignoreQueryPrefix: true });

// PLEASE FIX THIS FUNCTION FUTURE ME
const autoscroll = () => {

    // New message element
    const newMessage = messages.lastElementChild;
    // console.log(messages.children);

    // Height of the new message
    const newMessageStyles = getComputedStyle(newMessage);
    const newMessageMargin = parseInt(newMessageStyles.marginBottom);
    const newMessageHeight = newMessage.offsetHeight + newMessageMargin;

    // Visible height
    const visibleHeight = messages.offsetHeight;

    // Height of messages container
    const containerHeight = messages.scrollHeight;

    // How far have I scrolled?
    const scrollTop = messages.scrollTop;

    if (Math.ceil(scrollTop + visibleHeight) >= (containerHeight - newMessageHeight)) {
        messages.scrollTop = messages.scrollHeight;
    } else if (scrollTop == 0) {
        messages.scrollTop = messages.scrollHeight;
    }

}

// on new mnessage received
socket.on('newMessage', ({ username, text, createdAt } = {}) => {
    const messageHtml = Mustache.render(messageTemplate, {
        username,
        'message': text,
        'createdAt': moment(createdAt).format('h:mm:ss A')
    }); // rendering a template using mustache

    // rendering a template using mustache
    messages.insertAdjacentHTML('beforeend', messageHtml); // adding html before end of a div
    autoscroll();
});

// on new location message received
socket.on('newLocationMessage', ({ username, location, createdAt } = {}) => {

    const messageHtml = Mustache.render(locationMessageTemplate, {
        username,
        location,
        createdAt: moment(createdAt).format('h mm ss A')
    });
    messages.insertAdjacentHTML('beforeend', messageHtml);
    autoscroll();
});

// Sending a new message
const message = document.getElementById('message');

messageForm.addEventListener('submit', (e) => {
    e.preventDefault();

    sendMessageBtn.setAttribute('disabled', 'disabled');
    sendMessageBtn.style.backgroundColor = 'rgb(190, 190, 190)';

    socket.emit('sendMessage', message.value, (error) => {

        sendMessageBtn.removeAttribute('disabled');
        sendMessageBtn.style.backgroundColor = 'rgb(86, 86, 255)';
        message.focus();

        // this runs when the event is achknowledged
        if (error) {
            return alert(error);
        }
        console.log('Message Delivered.');
    });

    message.value = "";
});

// Sending current location
const success = ({ coords: { latitude, longitude } } = {}) => {
    socket.emit('sendLocation', {
        latitude,
        longitude
    }, () => {
        sendLocationBtn.removeAttribute('disabled');
        sendLocationBtn.style.backgroundColor = 'rgb(86, 86, 255)';
        console.log('Location Shared!');
    });
}

const error = (err) => {
    alert("Couldn't fetch your location, ", err.message);
}

document.getElementById('sendLocation').addEventListener('click', () => {

    if (!navigator.geolocation) {
        return alert("Your browser doesn't support geolocation.")
    }

    sendLocationBtn.setAttribute('disabled', 'disabled');
    sendLocationBtn.style.backgroundColor = 'rgb(190, 190, 190)';

    navigator.geolocation.getCurrentPosition(success, error, { timeout: 5000 });
});

socket.emit('join', { username, room }, (error) => {
    if (error) {
        alert(error);
        location.href = "/"
    }
});

socket.on('roomData', ({ room, users }) => {

    const userListHtml = Mustache.render(sidebarTemplate, {
        room,
        users
    });

    sidebar.innerHTML = userListHtml;

});
