const socket = io()

// socket.on('countUpdated', (count) => {
//     console.log('count has been updated', count)
// })

// document.querySelector("#increment").addEventListener('click', () =>{
//     console.log('clicked')
//     socket.emit('increment')
// })

const $messageForm = document.querySelector('#msg-form')
const $messgeFormInput = $messageForm.querySelector('input')
const $messageFormButton = $messageForm.querySelector('button')
const $sendLocation = document.querySelector('#location')
const $messages = document.querySelector('#messages')

const messageTemplate = document.querySelector('#message-template').innerHTML
const locationMessageTemplate = document.querySelector('#location-message-template').innerHTML
const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML

const { username, room }= Qs.parse(location.search, { ignoreQueryPrefix: true })

const autoscroll = () => {
    const $newMessage = $messages.lastElementChild

    const newMessageStyle = getComputedStyle($newMessage)
    const newMessageMargin = parseInt(newMessageStyle.marginBottom)
    const newMessageHeight = $newMessage.offsetHeight + newMessageMargin

    const visibleHeight = $messages.offsetHeight

    const containerHeight = $messages.scrollHeight

    const scrollOffset = $messages.scrollTop + visibleHeight

    if (containerHeight - newMessageHeight <= scrollOffset){
        $messages.scrollTop = $messages.scrollHeight
    }
}

socket.on('message', (message) => {
    console.log(message)
    const html = Mustache.render(messageTemplate, {
        username: message.username,
        message: message.text,
        createdAt: moment(message.createdAt).format('h:mm a')
    })
    $messages.insertAdjacentHTML('beforeend', html) 
    autoscroll()  
})

socket.on('locationMessage', (message) => {
    console.log(message)
    const html = Mustache.render(locationMessageTemplate, {
        username: message.username,
        url: message.url,
        createdAt: moment(message.createdAt).format('h:mm a')
    })
    $messages.insertAdjacentHTML('beforeend', html)
    autoscroll()
})

socket.on('roomData', ({ room, users}) => {
   const html = Mustache.render(sidebarTemplate, {
    room,
    users
   })
   document.querySelector('#sidebar').innerHTML = html
})



$messageForm.addEventListener('submit', (e) => {
    e.preventDefault()

    $messageFormButton.setAttribute('disabled', 'disabled')

    const message = e.target.elements.message.value

    socket.emit('sendMessage', message, (error) => {
        $messageFormButton.removeAttribute('disabled')
        $messgeFormInput.value = ''
        $messgeFormInput.focus()


        if (error){
            return console.log('bad words not allowed')
        }
        console.log('Deliverd.!')
    }) 

})

$sendLocation.addEventListener('click', () => {
    if (!navigator.geolocation){
       return alert('sorry, unable to share a location')
    }

    $sendLocation.setAttribute('disabled', 'disabled')

    navigator.geolocation.getCurrentPosition((position) => {
        // console.log(position)

        socket.emit('sendLocation', {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
        }, () =>{
            $sendLocation.removeAttribute('disabled')
            console.log('location shared')
        })

    })

})

socket.emit('join', { username, room }, (error) => {
    if (error){
        alert(error)
        location.href = '/'
    }
})
