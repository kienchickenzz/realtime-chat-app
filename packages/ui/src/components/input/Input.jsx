import { useState, useEffect, useRef } from 'react'
import PropTypes from 'prop-types'
import { FormControl, OutlinedInput } from '@mui/material'
import { useTheme } from '@mui/material/styles'

export const Input = ({ inputParam, value, onChange, disabled = false }) => {
    const theme = useTheme()

    const [myValue, setMyValue] = useState(value ?? '')
    const ref = useRef(null)

    const getInputType = (type) => {
        switch (type) {
            case 'string':
                return 'text'
            case 'password':
                return 'password'
            case 'number':
                return 'number'
            case 'email':
                return 'email'
            default:
                return 'text'
        }
    }

    return (
        <>
            { (
                <FormControl sx={{ mt: 1, width: '100%' }} size='small'>
                    <OutlinedInput
                        id={inputParam.name}
                        size='small'
                        disabled={disabled}
                        type={getInputType(inputParam.type)}
                        placeholder={inputParam.placeholder}
                        multiline={!!inputParam.rows}
                        rows={inputParam.rows ?? 1}
                        value={myValue}
                        name={inputParam.name}
                        onChange={(e) => {
                            setMyValue(e.target.value)
                            onChange(e.target.value)
                        }}
                        inputProps={{
                            step: inputParam.step ?? 1,
                            style: {
                                height: inputParam.rows ? '90px' : 'inherit'
                            }
                        }}
                        sx={{
                            '& .MuiOutlinedInput-notchedOutline': {
                                borderColor: theme.palette.grey[900] + 25
                            }
                        }}
                    />
                </FormControl>
            ) }
            <div ref={ref}></div>
        </>
    )
}

Input.propTypes = {
    inputParam: PropTypes.object,
    value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    onChange: PropTypes.func,
    disabled: PropTypes.bool,
}
