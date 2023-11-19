<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Document</title>
    <style>
        body{
            background-color: #212121;
        }
        .box{
            --background: white;/*linear-gradient(to left, #f7ba2b 0%, #ea5358 100%)*/;
            width: 600px;
            height: 750px;
            margin-top: 100px;
            margin-left: 550px;
            padding: 5px;
            border-radius: 1rem;
            overflow: visible;
            background: #f7ba2b;
            background: var(--background);
            position: relative;
            z-index: 1;
        }
        .container{
            --color: #212121;
            background: var(--color);
            color: var(--color);
            display: flex;
            justify-content: center;
            align-items: center;
            
            width: 100%;
            height: 100%;
            overflow: visible;
            border-radius: .7rem;
        }
        a{
            
            justify-content: center;
            align-items: center;
        }
        
        .input {
            margin-top: 40px;
            height: 40px;
            width: 400px;
            font-family: -apple-system,BlinkMacSystemFont,"Segoe UI","Roboto","Oxygen","Ubuntu","Cantarell","Fira Sans","Droid Sans","Helvetica Neue",sans-serif;
            font-weight: 500;
            font-size: .8vw;
            color: #fff;
            background-color: rgb(28,28,30);
            box-shadow: 0 0 .4vw rgba(0,0,0,0.5), 0 0 0 .15vw transparent;
            border-radius: 0.4vw;
            border: none;
            outline: none;
            padding: 0.4vw;
            
            transition: .4s;
        }

        .input:hover {
            box-shadow: 0 0 0 .15vw rgba(135, 207, 235, 0.186);
        }

        .input:focus {
            box-shadow: 0 0 0 .15vw skyblue;
        }

        .button {
            margin-top: 90px;
            text-decoration: none;
            position: absolute;
            border: none;
            font-size: 14px;
            font-family: inherit;
            color: #fff;
            width: 200px;
            height: 3em;
            line-height: 2em;
            text-align: center;
            background: linear-gradient(90deg,#03a9f4,#f441a5,#ffeb3b,#03a9f4);
            background-size: 300%;
            border-radius: 15px;
            z-index: 1;
        }

        .button:hover {
            animation: ani 8s linear infinite;
            border: none;
        }

        @keyframes ani {
            0% {
            background-position: 0%;
        }

        100% {
            background-position: 400%;
        }
        }

        .button:before {
            content: '';
            position: absolute;
            top: -5px;
            left: -5px;
            right: -5px;
            bottom: -5px;
            z-index: -1;
            background: linear-gradient(90deg,#03a9f4,#f441a5,#ffeb3b,#03a9f4);
            background-size: 400%;
            border-radius: 35px;
            transition: 1s;
        }

        .button:hover::before {
            filter: blur(20px);
        }

        .button:active {
            background: linear-gradient(32deg,#03a9f4,#f441a5,#ffeb3b,#03a9f4);
        }

    </style>
</head>
<body>
    <div class="box">
        <div class="container">
            <form action = "/Societify/login.php" method = "POST">
                <input type="text" name="name" class="input" placeholder="Write your Name">
                <br>
                <input type="password" name = "pass" class ="input" placeholder="Write your Password">
                <br>
                <div class="container">
                    <input type = "submit" class="button" value="Login">
                </div>
            </form>
        </div>
    </div>

    <?php
    $servername = "localhost";
    $username = "root";
    $password = "";
    $database = "prabhat";

    $conn = mysqli_connect($servername, $username, $password, $database);

    if (!$conn){
        die("Sorry we failed to connect: ". mysqli_connect_error());
    }

    if ($_SERVER['REQUEST_METHOD'] == 'POST') {
        $name = $_POST['name'];
        $pass = $_POST['pass'];  
    
        $sql2 = "SELECT `Name`, `Password` FROM `emp` WHERE `Name` = '$name'";
        $result = mysqli_query($conn, $sql2);
        $row = mysqli_fetch_assoc($result);

        if ($pass == $row['Password']){
            
            echo "<script>";
            echo "window.location.href = 'http://localhost/Societify/index.html';";
            echo "</script>";
 
        }
        else{
            echo "Wrong Password";
        }
    }
?>

</body>
</html>