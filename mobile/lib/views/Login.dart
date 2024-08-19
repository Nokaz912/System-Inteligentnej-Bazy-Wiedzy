import 'dart:ui';

import 'package:flutter/material.dart';
import 'package:mobile/models/Styles.dart';

import 'Register.dart';

class LoginPage extends StatefulWidget {
  const LoginPage({super.key});

  @override
  State<LoginPage> createState() => _LoginPageState();
}

class _LoginPageState extends State<LoginPage> {

  final TextEditingController _loginController = TextEditingController();
  final TextEditingController _passwordController = TextEditingController();

  late double screenWidth;
  late double screenHeight;

  @override
  void initState() {
    super.initState();
    FlutterView view = WidgetsBinding.instance.platformDispatcher.views.first;
    Size size = view.physicalSize;
    screenWidth = size.width;
    screenHeight = size.height;
  }
  @override
  void didChangeDependencies() {
    _loginController.clear();
    _passwordController.clear();
    super.didChangeDependencies();
  }

  void didPopNext() {
    _loginController.clear();
    _passwordController.clear();
  }
  bool _obscureText = true;

  void _togglePasswordVisibility() {
    setState(() {
      _obscureText = !_obscureText;
    });
  }

  @override
  Widget build(BuildContext context) {
    final screenHeight = MediaQuery.of(context).size.height;
    final screenWidth = MediaQuery.of(context).size.width;
    double fontSizeScale = screenWidth / 400;
    bool isKeyBoardOpen = MediaQuery.of(context).viewInsets.bottom != 0;
    return Scaffold(
        body: Stack(
          children: [
            Container(
              height: double.infinity,
              width: double.infinity,
              decoration: const BoxDecoration(
                gradient: LinearGradient(colors: [
                  AppColors.dark,
                  AppColors.darkest,
                ]),
              ),
              child: Padding(
                padding: EdgeInsets.only(top: screenHeight * 0.085, left: screenWidth * 0.05),
                child: Text(
                  'Hello\nSign in!',
                  style: AppTextStyles.colorText(fontSizeScale, 30, Colors.white)
                ),
              ),
            ),
            Padding(
              padding: EdgeInsets.only(top: screenHeight * 0.22),
              child: Container(
                decoration: const BoxDecoration(
                  borderRadius: BorderRadius.only(
                      topLeft: Radius.circular(40), topRight: Radius.circular(40)),
                  color: Colors.white,
                ),
                height: double.infinity,
                width: double.infinity,
                child:  Padding(
                  padding:  EdgeInsets.only(left:screenWidth * 0.045,right: screenWidth * 0.045),
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      SizedBox(height: screenHeight * 0.05),
                      TextField(
                        decoration: InputDecoration(
                            suffixIcon: const Icon(Icons.check,color: AppColors.purple,),
                            label: Text('Login',style: AppTextStyles.colorText(fontSizeScale, 16, AppColors.purple),)
                        ),
                      ),
                      TextField(
                        decoration: InputDecoration(
                            suffixIcon: IconButton(
                              icon: Icon(
                                _obscureText ? Icons.visibility_off : Icons.visibility,
                                color: Colors.purple,
                              ),
                              onPressed: _togglePasswordVisibility,
                            ),
                            label: Text('Password',style: AppTextStyles.colorText(fontSizeScale, 16, AppColors.purple),)
                        ),
                        obscureText: _obscureText,
                      ),
                      SizedBox(height: screenHeight * 0.015),
                      Align(
                        alignment: Alignment.centerRight,
                        child: Text('Forgot Password?',style: AppTextStyles.colorText(fontSizeScale, 16, AppColors.purple)
                      ),
                      ),
                      SizedBox(height: screenHeight * 0.07),
                      InkWell(
                        onTap: () {

                        },
                      child: Container(
                        height: screenHeight * 0.065,
                        width: screenWidth * 0.81,
                        decoration: BoxDecoration(
                          borderRadius: BorderRadius.circular(30),
                          gradient: const LinearGradient(
                              colors: [
                                AppColors.purple,
                                AppColors.darkest,
                              ]
                          ),
                        ),
                        child: const Center(child: Text('SIGN IN',style: TextStyle(
                            fontWeight: FontWeight.bold,
                            fontSize: 20,
                            color: Colors.white
                        ),),),
                      ),
                      ),
                      SizedBox(height: screenHeight * 0.02),
                      Align(
                        alignment: Alignment.bottomRight,
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.end,
                          crossAxisAlignment: CrossAxisAlignment.end,
                          children: [
                            Text("Don't have account?",style: AppTextStyles.colorText(fontSizeScale, 14, AppColors.purple),),
                            InkWell(
                              onTap: () {
                                Navigator.push(
                                  context,
                                  MaterialPageRoute(builder: (context) => const RegisterPage()),
                                );
                              },
                            child: Text("Sign up",style: AppTextStyles.colorText(fontSizeScale, 16, AppColors.purple),)
                            ),
                          ],
                        ),
                      ),
                      if(!isKeyBoardOpen)
                      SizedBox(height: screenHeight * 0.2),
                    ],
                  ),
                ),
              ),
            ),
          ],
        ));
  }
}
