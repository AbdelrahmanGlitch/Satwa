import bcrypt from 'bcrypt';
export const compare = async (password, userPassword)=>{
    return bcrypt.compareSync(password, userPassword)
}
