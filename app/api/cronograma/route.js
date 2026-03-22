// app/api/cronograma/route.js (CÓDIGO FINAL E COMPLETO COM TODAS AS CORREÇÕES)

import { NextResponse } from 'next/server';
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
  throw new Error("SUPABASE_URL não definida.");
}

if (!supabaseServiceRoleKey) {
  throw new Error("SUPABASE_SERVICE_ROLE_KEY não definida.");
}

export const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);
const TABLE_NAME = 'cronograma'; 

// --- GET: LER DADOS (SELECT) ---
export async function GET() {
    try {
        const { data, error } = await supabase
            .from(TABLE_NAME)
            .select('*') 
            .order('Ano', { ascending: true })
            .order('Mes', { ascending: true }); // Usando 'Ano' e 'Mes'

        if (error) {
            console.error('Erro no Supabase GET:', error);
            // Se falhar aqui, o problema é RLS, Chave ou Coluna Inexistente.
            return NextResponse.json({ 
                error: 'Falha ao buscar dados do Supabase', 
                details: error.message 
            }, { status: 500 });
        }
        
        // Mapeamento: Usando as colunas exatas do DB
        const cronogramaData = data.map(row => ({
            id: row.id, 
            local: row.UFVS, // CORREÇÃO: Usando 'UFVS'
            estado: row.Estado, // CORREÇÃO: Usando 'Estado'
            atividade: row.Atividade, // CORREÇÃO: Usando 'Atividade'
            status: row.Status, // CORREÇÃO: Usando 'Status'
            inicio: `${row.Mes} ${row.Ano}`, 
            ano: row.Ano,
            mes: row.Mes,
        }));

        return NextResponse.json({ data: cronogramaData }, { status: 200 });
        
    } catch (error) {
        return NextResponse.json({ error: 'Erro interno do servidor GET.', details: error.message }, { status: 500 });
    }
}

export async function GetActivitiesPerStatus() {
    try {
        const { data, error } = await supabase
            .from('activitiesperstatus')
            .select('*') 

        if (error) {
            console.error('Erro no Supabase GET:', error);
            // Se falhar aqui, o problema é RLS, Chave ou Coluna Inexistente.
            return NextResponse.json({ 
                error: 'Falha ao buscar dados do Supabase', 
                details: error.message 
            }, { status: 500 });
        }
        
        // Mapeamento: Usando as colunas exatas do DB
        const cronogramaData = data.map(row => ({
            id: row.id, 
            local: row.ufvs, // CORREÇÃO: Usando 'UFVS'
            estado: row.estado, // CORREÇÃO: Usando 'Estado'
            atividade: row.atividade, // CORREÇÃO: Usando 'Atividade'
            status: row.status, // CORREÇÃO: Usando 'Status'
            inicio: `${row.mes} ${row.ano}`, 
            ano: row.ano,
            mes: row.mes,
        }));

        return NextResponse.json({ data: cronogramaData }, { status: 200 });
        
    } catch (error) {
        return NextResponse.json({ error: 'Erro interno do servidor GET.', details: error.message }, { status: 500 });
    }
}


// --- POST: INCLUIR DADOS (INSERT) ---
export async function POST(request) {
    try {
        const newActivity = await request.json();
        
        const [mes, anoStr] = newActivity.inicio.split(' ');
        const Ano = parseInt(anoStr, 10); 
        const Mes = mes;
        
        // CORREÇÃO: Chaves do Objeto de Inserção com Capitalização Correta
        const activityToInsert = {
            UFVS: newActivity.local, // CORREÇÃO: Usando 'UFVS'
            Estado: newActivity.estado, // CORREÇÃO: Usando 'Estado'
            Atividade: newActivity.atividade, // CORREÇÃO: Usando 'Atividade'
            Status: newActivity.status, // CORREÇÃO: Usando 'Status'
            Mes: Mes, 
            Ano: isNaN(Ano) ? null : Ano,
        };

        const { data, error } = await supabase
            .from(TABLE_NAME)
            .insert([activityToInsert])
            .select();

        if (error) {
            return NextResponse.json({ error: 'Falha ao criar atividade.', details: error.message }, { status: 500 });
        }
        return NextResponse.json(data[0], { status: 201 }); 

    } catch (error) {
        return NextResponse.json({ error: 'Falha ao processar POST.', details: error.message }, { status: 500 });
    }
}


// --- PUT: ALTERAR DADOS (UPDATE) ---
export async function PUT(request) {
    try {
        const updatedActivity = await request.json();
        const { id, inicio, local, ...fieldsToUpdate } = updatedActivity;
        
        if (!id) return NextResponse.json({ error: 'ID da atividade ausente.' }, { status: 400 });

        const [mes, anoStr] = inicio.split(' ');
        const Ano = parseInt(anoStr, 10);
        const Mes = mes;
        
        // Prepara o payload, garantindo a capitalização correta no banco
        const updatePayload = {
            Mes: Mes, 
            Ano: isNaN(Ano) ? null : Ano, 
            UFVS: local, // CORREÇÃO: Usando 'UFVS'
            Estado: fieldsToUpdate.estado,
            Atividade: fieldsToUpdate.atividade,
            Status: fieldsToUpdate.status,
            // (Outros campos são incluídos por spread, mas estes são os mais críticos)
        };

        const { data, error } = await supabase
            .from(TABLE_NAME)
            .update(updatePayload)
            .eq('id', id)
            .select();

        if (error) {
            return NextResponse.json({ error: 'Falha ao atualizar.', details: error.message }, { status: 500 });
        }
        
        return NextResponse.json(data[0], { status: 200 });

    } catch (error) {
        return NextResponse.json({ error: 'Falha ao processar PUT.', details: error.message }, { status: 500 });
    }
}


// --- DELETE: EXCLUIR DADOS (DELETE) ---
export async function DELETE(request) {
    try {
        const { id } = await request.json();
        
        if (!id) return NextResponse.json({ error: 'ID da atividade ausente.' }, { status: 400 });

        const { error } = await supabase
            .from(TABLE_NAME)
            .delete()
            .eq('id', id);

        if (error) {
            return NextResponse.json({ error: 'Falha ao excluir.', details: error.message }, { status: 500 });
        }
        
        return new NextResponse(null, { status: 204 }); 

    } catch (error) {
        return NextResponse.json({ error: 'Falha ao processar DELETE.', details: error.message }, { status: 500 });
    }
}