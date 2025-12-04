const form = document.querySelector("form");
        const emailError = document.querySelector(".email.error");
        const passwordError = document.querySelector(".password.error");


        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            //reset the values
            emailError.textContent = "";
            passwordError.textContent = "";
              

            //get the values
            const email = form.email.value;
            const password = form.password.value;

            try {
                
                
                const res = await fetch('/signup', {




                    headers: { 'Content-Type': 'application/json' },
                    method: 'POST',
                    body: JSON.stringify({ email, password })
                });
                

                const data = await res.json();
                console.log(data);

                

                if(data.errors){
                   emailError.textContent = data.errors.email;
                   passwordError.textContent = data.errors.password;
                }

                if(data.user){
                    location.assign("/login");
                }
                


            } catch (error) {
                console.log(error);
            }
        })