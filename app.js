// Import the functions you need from the SDKs you need
import {initializeApp}  from 'https://www.gstatic.com/firebasejs/10.5.2/firebase-app.js';
import { getAuth, onAuthStateChanged, signInAnonymously} from 'https://www.gstatic.com/firebasejs/10.5.2/firebase-auth.js';
import { getDatabase, remove, ref, set, update, onDisconnect, onValue, onChildAdded, onChildRemoved} from 'https://www.gstatic.com/firebasejs/10.5.2/firebase-database.js';

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// '' ""
// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDUZhDvpQ48W-WRztuMR3C3scH3ZsFzLXQ",
  authDomain: "multiplayer-game-11915.firebaseapp.com",
  databaseURL: "https://multiplayer-game-11915-default-rtdb.firebaseio.com",
  projectId: "multiplayer-game-11915",
  storageBucket: "multiplayer-game-11915.appspot.com",
  messagingSenderId: "200371842975",
  appId: "1:200371842975:web:f2186e91439a0dc3d797aa"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app)
const database = getDatabase(app)

const player_colors = ["red","green", "orange", "purple", "black"]

const map_data = {
    min_x: 1,
    max_x: 14,
    min_y: 4,
    max_y: 12,

    blocked_spaces: {
        "7x6": true,
        "1x11": true,
        "12x18": true,
        "4x7": true,
        "5x7": true,
        "6x7": true,
        "8x6": true,
        "9x6": true,
        "10x6": true,
        "7x9": true,
        "8x9": true,
        "9x9": true
    }
}

function random_from_array(array) {
    return array[Math.floor(Math.random() * array.length)];
}

function get_key_string(x, y){
    return `${x}x${y}`;
}

function create_name(){
    const prefix = random_from_array([
        "SUPER",
        "COOL",
        "DARK",
        "LONG",
        "GOOD",
        "RICH"
    ])
    const animal = random_from_array([
        "BEAR",
        "DOG",
        "CAT",
        "LION",
        "LAMB"
    ])
    return `${prefix} ${animal}`
}

function is_solid(x, y){

    const blocked_next_space = map_data.blocked_spaces[get_key_string(x, y)]

    return ( blocked_next_space ||
        x >= map_data.max_x || 
        x < map_data.min_x ||
        y >= map_data.max_y ||
        y < map_data.min_y
        )
}

function get_random_safe_spot(){
    return random_from_array([
        {x: 1, y: 4},
        {x: 2, y: 4},
        {x: 1, y: 5},
        {x: 2, y: 6},
        {x: 2, y: 8},
        {x: 2, y: 9},
        {x: 4, y: 8},
        {x: 5, y: 5},
        {x: 5, y: 8},
        {x: 5, y: 10},
        {x: 5, y: 11},
        {x: 11, y: 7},
        {x: 12, y: 7},
        {x: 13, y: 7},
        {x: 13, y: 6},
        {x: 13, y: 8},
        {x: 7, y: 6},
        {x: 7, y: 7},
        {x: 7, y: 8},
        {x: 8, y: 8},
        {x: 10, y: 8},
        {x: 8, y: 8},
        {x: 11, y: 4},
    ]);
}

(function (){

    let player_id= "";
    let player_ref = "";
    let players = {}
    let player_element = {};
    let coins = {};
    let coin_elements = {};

    const game_container = document.querySelector(".game-container")
    const player_name_input = document.querySelector("#player-name")
    const player_color_button = document.querySelector("#player-color")

    function place_coin(){
        const {x, y} = get_random_safe_spot()
        

        const coin_ref = ref(database, `coins/${get_key_string(x, y)}`)
        set(coin_ref, {
            x,
            y,
        })

        const coin_timeouts = [5000, 6000, 7000, 8000];
        setTimeout(() => {
            place_coin()
        }, random_from_array(coin_timeouts))
    }

    function attempt_grab_coin(x, y){
        const key = get_key_string(x, y)
        if(coins[key]){
            remove(ref(database, `coins/${key}`))
            update(player_ref, {
                coins: players[player_id].coins + 1
            })
        }
    }

    function handle_arrow_press(x_change, y_change){
        const new_x = players[player_id].x + x_change;
        const new_y = players[player_id].y + y_change;

        if(!is_solid(new_x, new_y)){
            players[player_id].x = new_x;
            players[player_id].y = new_y;
            if(x_change === 1){
                players[player_id].direction = 'right';
            }
            if(x_change === -1){
                players[player_id].direction = 'left';
            }
            set(player_ref, players[player_id])
            attempt_grab_coin(new_x, new_y)
        }
    }

    function init_game(){

        new KeyPressListener("ArrowUp", () => handle_arrow_press(0, -1))
        new KeyPressListener("ArrowDown", () => handle_arrow_press(0, 1))
        new KeyPressListener("ArrowLeft", () => handle_arrow_press(-1, 0))
        new KeyPressListener("ArrowRight", () => handle_arrow_press(1, 0))


        const all_player_ref = ref(database, "players");
        const all_coins_ref = ref(database, "coins");

        onValue(all_player_ref, (snapshot) => {
            // Fires whenever a change occurs
            players = snapshot.val() || {};
            Object.keys(players).forEach((key) => {
                const character_state = players[key];
                let el = player_element[key];
                el.querySelector('.Character_name').innerText = character_state.p_name;
                el.querySelector(".Character_coins").innerText = character_state.coins;
                el.setAttribute("data-color", character_state.color);
                el.setAttribute("data-direction", character_state.direction)
                const left = 16 * character_state.x + "px";
                const top = 16 * character_state.y - 4 + "px";
                el.style.transform = `translate3d(${left}, ${top}, 0)`;
                })

        })
        onChildAdded(all_player_ref, (snapshot) => {
            // Fires whenever a new node is added to the tree
            const added_player = snapshot.val();
            const character_element = document.createElement("div");
            character_element.classList.add("Character", "grid-cell")
            if(added_player.id == player_id){
                character_element.classList.add('you');
            }
            character_element.innerHTML = (`
            <div class="Character_shadow grid-cell"></div>
            <div class="Character_sprite grid-cell"></div>
            <div class="Character_name-container">
                <span class="Character_name"></span>
                <span class="Character_coins">0</span>
            </div>
            <div class="Character_you-arrow"></div>
            `);

            player_element[added_player.id] = character_element;

            // Fill in some initial state
            character_element.querySelector('.Character_name').innerText = added_player.p_name;
            character_element.querySelector(".Character_coins").innerText = added_player.coins;
            character_element.setAttribute("data-color", added_player.color);
            character_element.setAttribute("data-direction", added_player.direction)
            const left = 16 * added_player.x + "px";
            const top = 16 * added_player.y - 4 + "px";
            character_element.style.transform = `translate3d(${left}, ${top}, 0)`

            game_container.appendChild(character_element)
        })

        onChildRemoved(all_player_ref, (snapshot) => {
            const remove_key = snapshot.val().id;
            game_container.removeChild(player_element[remove_key])
            delete player_element[remove_key]
        })

        onChildAdded(all_coins_ref, (snapshot) => {
            const coin = snapshot.val()
            const key = get_key_string(coin.x, coin.y)
            coins[key] = true;

            //  Create the dom element
            const coin_element = document.createElement("div")
            coin_element.classList.add("Coin", "grid-cell")
            coin_element.innerHTML = `
            <div class="Coin_shadow grid-cell"></div>
            <div class="Coin_sprite grid-cell"></div>
            `

            // Position the element
            const left = 16 * coin.x + "px"
            const top = 16 * coin.y - 4 + "px"
            coin_element.style.transform = `translate3d(${left}, ${top}, 0)`

            coin_elements[key] = coin_element
            game_container.appendChild(coin_element)
        })

        onChildRemoved(all_coins_ref, (snapshot) => {
            const {x, y} = snapshot.val()
            const key_to_remove = get_key_string(x, y)
            game_container.removeChild(coin_elements[key_to_remove])
            delete coins[key_to_remove]
        })


        // Update player name
        player_name_input.addEventListener("change", (e) => {
            const new_name = e.target.value || create_name()
            player_name_input.value = new_name
            update(player_ref, {
                p_name: new_name
            })
        })

        // Update player color
        player_color_button.addEventListener('click', () => {
            const skin_color = player_colors.indexOf(players[player_id].color)
            const next_color = player_colors[skin_color + 1] || player_colors[0]
            update(player_ref, {
                color: next_color
            })
        })

        place_coin()
       
        
    }
    onAuthStateChanged(auth, (user) => {
        // console.log(user.uid)
        if (user){
            player_id = user.uid;
            player_ref = ref(database, `players/${player_id}`)

            const player_name = create_name()

            player_name_input.value = player_name

            const {x, y} = get_random_safe_spot();
            
            set(player_ref, {
                id: player_id,
                p_name: player_name || null,
                direction: "right",
                color: random_from_array(player_colors),
                x: x,
                y: y,
                coins: 0
            })

            // Remove player from firebase when player disconnects
            onDisconnect(player_ref).remove();

            //Initialize game
            init_game();

        } else {
            ////
        }
    })
    signInAnonymously(auth).catch((error) => {
        let error_code = error.code;
        let error_message = error.message;

        console.log(error_code, error_message)
    })
})();