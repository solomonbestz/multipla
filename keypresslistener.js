class KeyPressListener{
    constructor(key_code, callback){
        let key_safe = true;

        this.Keydown_function = function(event){
            if(event.code === key_code){
                if(key_safe){
                    key_safe = false;
                    callback();
                }
            }
        };

        this.Keyup_function = function(event){
            if(event.code === key_code){
                key_safe = true;
            }
        };

        document.addEventListener("keydown", this.Keydown_function)
        document.addEventListener("keyup", this.Keyup_function)
    }

    unbind(){
        document.removeEventListener("keydown", this.Keydown_function);
        document.removeEventListener("keyup", this.Keyup_function)
    }
}