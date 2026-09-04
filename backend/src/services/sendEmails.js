import nodemailer from 'nodemailer';
export const sendEmail = async (to, subject, html, attachments)=>{
    const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
            user: process.env.EMAIL,
            pass: process.env.PASSWORD,
        },
    });
    try {
    const info = await transporter.sendMail({
        from: `"Satwa" <${process.env.EMAIL}>`,
        to: to? to : "ahmedabdelrahmen100@gmail.com",
        subject: subject ? subject : "Hello",
        html: html? html : "<b>Hello user?</b>",
        attachments: attachments? attachments : []
    });
    console.log("email")
    if(info.accepted.length){
        return true
    } else {
        return false
    }
    console.log("Message sent: %s", info);
    console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
    } catch (err) {
    console.error("Error while sending mail:", err);
    }
}   