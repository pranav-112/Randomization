
function myfun1(){
    let min = parseInt(document.getElementById("range1").value);
    let max = parseInt(document.getElementById("range2").value);
    let sel = parseInt(document.getElementById("selections").value);
    if(isNaN(min) || isNaN(max) || min < 0 || min>max || sel>(max-min)){
        alert("Sorry! Error in the inputs.");
        return;
    }
    // if(min>max){
    //     alert("Please enter correct range");
    //     return;
    // }
    // if(sel>(max-min)){
    //     alert("Number of selections can not be greater than number of VINs.");
    //     return;
    // }
    const arr = []
    while(arr.length < sel){
        var candidateInt = Math.floor(Math.random() * (max - min) ) + parseInt(min);
        if(arr.indexOf(candidateInt) === -1){
            arr.push(candidateInt);
        }
    }
    let n = Date();
    document.getElementById("des1").innerHTML = arr+("\n\n")+n;
}